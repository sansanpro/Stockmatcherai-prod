import sys, glob, os
from PIL import Image, ImageDraw
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
repo = os.path.dirname(os.path.dirname(ROOT))
files=sorted(glob.glob(os.path.join(repo,'marketing/app-store/*.jpg')))
box=(136,603,1184,2816); r=165
thumbs=[]
for f in files:
    im=Image.open(f).convert('RGBA').crop(box)
    S=3; m=Image.new('L',(im.width*S,im.height*S),0)
    ImageDraw.Draw(m).rounded_rectangle((0,0,m.width-1,m.height-1),r*S,fill=255)
    im.putalpha(m.resize(im.size,Image.LANCZOS))
    out=os.path.join(ROOT,'phones',os.path.basename(f)[:-4]+'.png'); im.save(out)
    thumbs.append(im)
tw,th=330,700
sheet=Image.new('RGB',(tw*len(thumbs)+20*(len(thumbs)+1),th+40),(90,90,90))
for i,t in enumerate(thumbs):
    t=t.resize((tw,th)); sheet.paste(t,(20+i*(tw+20),20),t)
sheet.save(os.path.join(ROOT,'previews/contact.png')); print(thumbs[0].size)
