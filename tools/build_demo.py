"""Assemble an edited walkthrough from real browser captures and original narration.

No screenshot content is altered. Captions appear outside the captured viewport.
Supply a locally installed FFmpeg executable as the only argument.
"""
from pathlib import Path
import json, subprocess, sys, wave

ROOT = Path(__file__).resolve().parents[1]
MEDIA = ROOT / 'evidence' / 'video'
FFMPEG = sys.argv[1]
SEGMENTS = json.loads((ROOT / 'tools' / 'narration.json').read_text(encoding='utf-8'))
TITLES = ['Dinner plans that survive real life', 'A real plan for a shared kitchen',
          'An interruption has a real cost', 'Confirm before changing the plan',
          'A different side. A different outcome.', 'A repaired plan you can inspect',
          'Keep your place when life interrupts', 'An impossible deadline stays impossible',
          'Reproducible, inspectable, zero paid APIs']
total = 0
for index, (segment, title) in enumerate(zip(SEGMENTS,TITLES)):
    image = MEDIA / segment['image']
    audio = image.with_suffix('.wav')
    if not image.exists(): raise FileNotFoundError(image)
    with wave.open(str(audio)) as wav: duration = wav.getnframes() / wav.getframerate() + 1.2
    total += duration
    title_path = MEDIA / f'title-{index:02}.txt'
    title_path.write_text(title, encoding='utf-8')
    # Relative textfile paths avoid Windows colon escaping in FFmpeg filter syntax.
    filters = ("scale=1240:535:force_original_aspect_ratio=decrease,"
               "pad=1280:720:(ow-iw)/2:66:color=0x153f36,setsar=1,"
               f"drawtext=fontfile='C\\:/Windows/Fonts/segoeui.ttf':textfile=title-{index:02}.txt:"
               "fontsize=27:fontcolor=white:x=36:y=21,"
               "drawtext=fontfile='C\\:/Windows/Fonts/segoeui.ttf':"
               f"text='SupperShift  |  Alexa+ simulated experience  |  {index+1}/9':"
               "fontsize=19:fontcolor=0xdce4cf:x=36:y=655")
    target = MEDIA / f'segment-{index:02}.mp4'
    subprocess.run([FFMPEG,'-hide_banner','-loglevel','error','-y','-loop','1','-i',str(image),
                    '-i',str(audio),'-vf',filters,'-af','apad','-t',str(duration),
                    '-r','24','-c:v','libx264','-preset','fast','-crf','19',
                    '-pix_fmt','yuv420p','-c:a','aac','-b:a','160k',str(target)],cwd=MEDIA,check=True)
if total >= 180: raise ValueError(f'Video exceeds the 3-minute limit: {total:.2f}s')
listing = MEDIA / 'concat.txt'
listing.write_text('\n'.join(f"file 'segment-{i:02}.mp4'" for i in range(len(SEGMENTS))),encoding='utf-8')
output = ROOT / 'evidence' / 'SupperShift-demo.mp4'
subprocess.run([FFMPEG,'-hide_banner','-loglevel','error','-y','-f','concat','-safe','0','-i',str(listing),
                '-c','copy','-movflags','+faststart',str(output)],cwd=MEDIA,check=True)
print(json.dumps({'output':str(output),'seconds':round(total,2),'bytes':output.stat().st_size,
                  'method':'Edited walkthrough of actual UI captures, with original synthetic narration'}))
