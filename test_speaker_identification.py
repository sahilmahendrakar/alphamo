#!/usr/bin/env python3
"""
Test harness for OpenAI speaker diarization with known speakers.
Tests that ben.wav, sahil.wav, and vish.wav are correctly identified.
"""

import base64
import sys
from pathlib import Path
from openai import OpenAI

client = OpenAI()

def to_data_url(path: str) -> str:
    """Convert audio file to base64 data URL"""
    with open(path, "rb") as fh:
        return "data:audio/wav;base64," + base64.b64encode(fh.read()).decode("utf-8")

def transcribe_with_known_speakers(audio_path: str, known_speakers: dict) -> dict:
    """
    Transcribe audio with known speaker references.

    Args:
        audio_path: Path to audio file to transcribe
        known_speakers: Dict with 'names' and 'references' lists

    Returns:
        Dict with 'text' and 'segments' from transcription
    """
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

    segments = []
    if hasattr(transcript, 'segments') and transcript.segments:
        for seg in transcript.segments:
            if isinstance(seg, dict):
                segments.append({
                    "speaker": seg.get("speaker"),
                    "text": seg.get("text"),
                    "start": seg.get("start"),
                    "end": seg.get("end"),
                })
            else:
                segments.append({
                    "speaker": getattr(seg, "speaker", ""),
                    "text": getattr(seg, "text", ""),
                    "start": getattr(seg, "start", 0),
                    "end": getattr(seg, "end", 0),
                })

    return {
        "text": transcript.text,
        "segments": segments
    }

def test_speaker_identification(audio_file: str, expected_speaker: str, all_speakers: dict) -> bool:
    """
    Test that an audio file is correctly identified as the expected speaker.

    Args:
        audio_file: Path to audio file to test
        expected_speaker: Expected speaker name (e.g., "ben")
        all_speakers: Dict with all known speaker names and references

    Returns:
        True if test passes, False otherwise
    """
    print(f"\n{'='*60}")
    print(f"Testing: {audio_file}")
    print(f"Expected speaker: {expected_speaker}")
    print(f"{'='*60}")

    result = transcribe_with_known_speakers(audio_file, all_speakers)

    print(f"\nTranscription: {result['text']}")
    print(f"\nSegments ({len(result['segments'])} total):")

    detected_speakers = set()
    for i, seg in enumerate(result['segments'], 1):
        speaker = seg['speaker']
        detected_speakers.add(speaker)
        print(f"  {i}. [{speaker}] {seg['text'].strip()}")

    print(f"\nDetected speakers: {', '.join(sorted(detected_speakers))}")

    success = expected_speaker in detected_speakers

    if success:
        print(f"✅ PASS - '{expected_speaker}' correctly identified")
    else:
        print(f"❌ FAIL - Expected '{expected_speaker}' but got {detected_speakers}")

    return success

def main():
    """Run all speaker identification tests"""
    public_dir = Path("public")

    known_speakers = {
        "names": ["ben", "sahil", "vish"],
        "references": [
            str(public_dir / "ben.wav"),
            str(public_dir / "sahil.wav"),
            str(public_dir / "vish.wav"),
        ]
    }

    print("\n" + "="*60)
    print("SPEAKER IDENTIFICATION TEST SUITE")
    print("="*60)
    print(f"\nKnown speakers: {', '.join(known_speakers['names'])}")
    print(f"Reference files:")
    for name, ref in zip(known_speakers['names'], known_speakers['references']):
        print(f"  - {name}: {ref}")

    tests = [
        ("public/ben.wav", "ben"),
        ("public/ben-test.wav", "ben"),
        ("public/sahil.wav", "sahil"),
        ("public/vish.wav", "vish"),
    ]

    results = []
    for audio_file, expected_speaker in tests:
        try:
            passed = test_speaker_identification(audio_file, expected_speaker, known_speakers)
            results.append((audio_file, expected_speaker, passed))
        except Exception as e:
            print(f"❌ ERROR: {e}")
            results.append((audio_file, expected_speaker, False))

    print("\n" + "="*60)
    print("TEST SUMMARY")
    print("="*60)

    for audio_file, expected_speaker, passed in results:
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{status} - {Path(audio_file).name} → {expected_speaker}")

    total = len(results)
    passed = sum(1 for _, _, p in results if p)
    failed = total - passed

    print(f"\nTotal: {total} tests")
    print(f"Passed: {passed}")
    print(f"Failed: {failed}")

    if failed > 0:
        print(f"\n❌ TESTS FAILED ({failed}/{total})")
        sys.exit(1)
    else:
        print(f"\n✅ ALL TESTS PASSED ({passed}/{total})")
        sys.exit(0)

if __name__ == "__main__":
    main()

