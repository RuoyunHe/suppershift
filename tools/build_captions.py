"""Build approximate, text-length-timed captions; this is not forced alignment.

Each image segment contains its matching WAV, followed by 1.2 seconds of silence.
Only the original narration is used. Standard library only.
"""
from pathlib import Path
import argparse
import json
import re
import textwrap
import wave


def stamp(milliseconds):
    hours, remaining = divmod(milliseconds, 3_600_000)
    minutes, remaining = divmod(remaining, 60_000)
    seconds, millis = divmod(remaining, 1_000)
    return f"{hours:02}:{minutes:02}:{seconds:02},{millis:03}"


def groups(text):
    """Sentence boundaries first, then at most two approximately 42-char lines."""
    result = []
    for sentence in re.split(r"(?<=[.!?])\s+", text.strip()):
        lines = textwrap.wrap(sentence, width=42, break_long_words=False,
                              break_on_hyphens=False)
        result.extend("\n".join(lines[i:i + 2]) for i in range(0, len(lines), 2))
    return result


def main():
    root = Path(__file__).resolve().parents[1]
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=root)
    parser.add_argument("--gap", type=float, default=1.2)
    parser.add_argument("--container-duration", type=float, default=156.88)
    args = parser.parse_args()
    narration = json.loads((args.root / "tools/narration.json").read_text(encoding="utf-8-sig"))
    cues, segments = [], []
    offset = 0.0
    for segment in narration:
        wav_path = args.root / "evidence/video" / (Path(segment["image"]).stem + ".wav")
        with wave.open(str(wav_path), "rb") as audio:
            duration = audio.getnframes() / audio.getframerate()
        chunks = groups(segment["text"])
        weights = [len(chunk.split()) for chunk in chunks]
        total = sum(weights)
        consumed = 0
        for chunk, weight in zip(chunks, weights):
            start = round((offset + duration * consumed / total) * 1000)
            consumed += weight
            end = round((offset + duration * consumed / total) * 1000)
            cues.append((start, end, chunk))
        segments.append({"wav": wav_path.name, "start": round(offset, 3),
                         "audio_seconds": round(duration, 6),
                         "caption_end": round(offset + duration, 3)})
        offset += duration + args.gap

    previous_end = 0
    for start, end, text in cues:
        assert start >= previous_end and end > start, "Non-monotonic caption timing"
        assert len(text.splitlines()) <= 2
        assert all(len(line) <= 42 for line in text.splitlines()), "Caption line exceeds 42 characters"
        previous_end = end
    original = " ".join(" ".join(segment["text"].split()) for segment in narration)
    reconstructed = " ".join(" ".join(text.split()) for _, _, text in cues)
    assert original == reconstructed, "Caption wording differs from the source narration"
    # Small container/frame-rounding differences are reported, never hidden by
    # claiming this text-length allocation is acoustic alignment.
    assert abs(offset - args.container_duration) < 0.5, "WAV timeline differs materially from video container"
    assert cues[-1][1] < round(args.container_duration * 1000), "Caption extends past the video"
    output = args.root / "evidence/SupperShift-demo.srt"
    output.write_text("\n\n".join(
        f"{index}\n{stamp(start)} --> {stamp(end)}\n{text}"
        for index, (start, end, text) in enumerate(cues, 1)) + "\n", encoding="utf-8")
    print(json.dumps({"output": str(output), "method": "Approximate word-count allocation; not forced alignment",
                      "cues": len(cues), "wav_timeline_seconds": round(offset, 6),
                      "video_container_seconds": args.container_duration,
                      "container_minus_wav_timeline_seconds": round(args.container_duration - offset, 6),
                      "last_caption_end_seconds": cues[-1][1] / 1000,
                      "checks": "monotonic; <=2 lines; <=42 characters per line; exact original wording",
                      "segments": segments}, indent=2))


if __name__ == "__main__":
    main()
