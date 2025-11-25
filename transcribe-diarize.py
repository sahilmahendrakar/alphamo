#!/usr/bin/env python3
import sys
import json
import base64
from openai import OpenAI

def to_data_url(path: str) -> str:
    with open(path, "rb") as fh:
        return "data:audio/wav;base64," + base64.b64encode(fh.read()).decode("utf-8")

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Missing arguments"}), file=sys.stderr)
        sys.exit(1)

    try:
        config = json.loads(sys.argv[1])

        audio_path = config.get("audio_path")
        known_speakers = config.get("known_speakers", {})

        if not audio_path:
            print(json.dumps({"error": "Missing audio_path"}), file=sys.stderr)
            sys.exit(1)

        client = OpenAI()

        extra_body = None
        if known_speakers.get("names") and known_speakers.get("references"):
            extra_body = {
                "known_speaker_names": known_speakers["names"],
                "known_speaker_references": [
                    to_data_url(ref) for ref in known_speakers["references"]
                ]
            }

        with open(audio_path, "rb") as audio_file:
            transcript = client.audio.transcriptions.create(
                model="gpt-4o-transcribe-diarize",
                file=audio_file,
                response_format="diarized_json",
                chunking_strategy="auto",
                extra_body=extra_body,
            )

        result = {
            "text": transcript.text,
            "segments": []
        }

        if hasattr(transcript, 'segments') and transcript.segments:
            for seg in transcript.segments:
                if isinstance(seg, dict):
                    result["segments"].append({
                        "type": seg.get("type"),
                        "text": seg.get("text"),
                        "speaker": seg.get("speaker"),
                        "start": seg.get("start"),
                        "end": seg.get("end"),
                        "id": seg.get("id")
                    })
                else:
                    result["segments"].append({
                        "type": getattr(seg, "type", None),
                        "text": getattr(seg, "text", ""),
                        "speaker": getattr(seg, "speaker", ""),
                        "start": getattr(seg, "start", 0),
                        "end": getattr(seg, "end", 0),
                        "id": getattr(seg, "id", "")
                    })

        print(json.dumps(result))

    except Exception as e:
        print(json.dumps({"error": str(e)}), file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()

