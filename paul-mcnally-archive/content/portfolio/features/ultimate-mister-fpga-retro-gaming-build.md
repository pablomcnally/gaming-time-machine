---
title: "My MiSTer FPGA is better than your MiSTer FPGA – here’s how to build the ultimate, ultimate retro gaming rig"
date: "2026-09-08"
slug: "ultimate-mister-fpga-retro-gaming-build"
excerpt: "A custom DEC-inspired case, NFC game cards, original controls and some avoidable soldering turned one MiSTer FPGA into the ultimate retro gaming rig."
publication: "The Escapist"
author: "Paul McNally"
tag: "Retro Gaming"
featuredImage: "/portfolio/features/ultimate-mister/supermister2-1536x1152.jpg.webp"
featuredImageAlt: "A custom MiSTer FPGA system built into a beige DEC-inspired terminal with keyboard, joystick and mouse"
micronetImage: "/portfolio/features/ultimate-mister/ultimate-mister-pablonet.jpg"
micronetImageAlt: "Pixel-art Micronet page showing a MiSTer FPGA retro gaming setup"
sourceUrl: "https://www.escapistmagazine.com/ultimate-mister-fpga-retro-gaming-build/"
---

I have been playing video games right from the off, when they first arrived, rather than picking them up as some kind of later hobby. My time goes back to the Mattel Intellivision, and you can read all about that in [my review earlier this year of the Intellivision Sprint](https://paulmcnally.online/reviews/intellivision-sprint-review).

Over the past couple of decades I've dabbled with renovating actual arcade machines, building bartops and playing incessantly with emulators, but it was round about 2019 when I first came into contact with the MiSTer FPGA project. Now, if you have no idea what I am on about, may I refer you to the explainer below, so have a read of that and pop back up here. If you are even vaguely into serious retro gaming, though, then likely you will know what I mean.

[There's something about the MiSTer](https://www.escapistmagazine.com/news-mister-fpga-ai-core-development-opinion/), and I am sure part of it is placebo and part of it is down to the technology, but that heady brew provides the most realistic old-school gaming experience I have ever had. There is something about being faced with an Amstrad's blue and yellow screen and loading a game on it and it being as you remember. You can also do that on an emulator, so I don't know quite what it is. It's odd.

But then you get into things the MiSTer can do great, depending on the core. You can load tape rips as if you are loading them via a cassette recording and wait eight minutes or so for a game to load. Who would ever do that, though, in this day and age? I would, that's who, because for me retro gaming is about rekindling memories and recapturing nostalgia, far more so than playing, in many cases, a terrible game from the '80s.

So, whether your weapon of choice is Sega or Sony, Arcade or Commodore, chances are that, up until around the Saturn generation, the MiSTer FPGA can handle playing it.

Great, but the thing is, it's not natively anything more than a small PCB with a few ports on it. There have been other versions, like the SuperStation, that incorporate the same hardware in a shell, but mine from back in the day is a board not much bigger than a Raspberry Pi. It's susceptible to me spilling coffee on it, yanking wires out of it or frying it with the weird, janky Euro power plug it comes with. So I decided to change that and build my Ultimate MiSTer FPGA. This is that journey.

[YOUTUBE:https://www.youtube.com/watch?v=KLdEn2B49mk|Building the ultimate MiSTer FPGA retro gaming rig]

## Building a home

Ever since I had a MiSTer setup I have had a 3D printer, and this hopefully final iteration of its forever home will be the third project this same DE-10 Nano has lived in. The first was a basic case printed in resin, which I thought would be nice and detailed. Unfortunately, resin shatters like glass if you drop it, so that did not last long.

Next up, and where it lived for a while, was a wedge-shaped computer case with a keyboard at the front and all the tech behind it. It was sort of like an Amiga and I quite liked it for ages, although God only knows why I chose metallic blue for the case colour.

Then I saw a video on YouTube of a new case based on a DEC business computer terminal from the late '70s. [Lorenzo Herrera (tin-cat) had taken the classic design](https://decmini.tin.cat/), remodelled it, 3D printed it and fitted a single-board computer inside it. The video I saw took it further and fitted a MiSTer Pi, a variant of the original MiSTer I have, inside. I saw it, fell in love with the look and decided that was my new project.

Grabbing [the files for the case from MakerWorld](https://makerworld.com/en/models/1942936-dec-mini-mister-edition?from=search#profileId-2086879) and printing them on my Bambu Lab H2D was the easy part. I found a beige filament I liked the look of for the main case and black for the screen surround, then got to work printing and gluing everything together. I'll spare you the process; it's all in the video above.

In theory, that should have been the most time-consuming part, but finding a screen and keyboard that fit the case turned out to be a mission.

## The great keyboard dilemma

Let's start with the keyboard. The case is designed around a Drevo Calibur V2, an old gaming keyboard that is no longer in production but can be picked up on eBay. When I was looking there was one described as "for parts" and another at twice the price that seemed fine. Basically, the keyboard comes out of its case and the PCB fits directly into the space in the new case, screwing in via its existing mounting points.

On the video there is no change to the look of the board, but I wanted something different. I hunted around for retro keycaps but couldn't find any I really liked. I had a C64-style keyboard from 8BitDo I'd reviewed a while back and decided it could donate its lovely brown caps to this project.

EufyMake had just sent me [the E1 for review](https://www.escapistmagazine.com/eufymake-e1-review-games-room-uv-printer/) and that will print beautifully on pretty much anything, including, would you believe, spacebars. So I added a flourishing touch by adding the MiSTer logo to the longest of keys. I was in love already.

![MiSTer FPGA logo printed directly onto the spacebar](/portfolio/features/ultimate-mister/spacebar.jpg.webp)
*MiSTer FPGA logo printed directly onto the spacebar*

## Screen test

The screen turned out to be an annoying, expensive find. The only size that fits in the case is a 9.7-inch, 1024x768, 4:3 small monitor. The one in the video was US-only and out of stock anyway, so I spent a couple of weeks on the hunt.

In the end I found, on Amazon, a guy selling the dimensions I needed in the form of a recycled iPad screen with driver board. I was sceptical and, indeed, returned the first one when it failed to power. The description, as I discovered, was completely wrong, stating that it could be powered with 5V when in reality it needs between 9V and 12V. I ultimately got it working and fitted it into the case.

I attached the keyboard and HDMI to the MiSTer, balanced everything on top of each other with some janky power cables coming out of a hole in the back, and turned it on. I'd fitted the fecking screen upside down in the frame, so it all had to come back apart again. Nice one, Paul.

Once I had it in place I hot-glued the driver boards to the back, sorted the cabling out, and that was that particular mission completed.

## Power up

I mentioned earlier the dubious Euro plug I had previously jammed into a shaving adapter, and it was time for that to go and the soldering iron to come out. I picked up the small Mean Well PSU in the video above and used it to power, after checking it with a multimeter, the screen and the DE-10 Nano.

It was a scary old switch-on the first time around, but it worked gloriously. I then soldered an IEC connector and switch to the back of the case as per the video, and for the first time ever I could turn my machine on and off without fearing I would electrocute myself. And that, frens, is a win.

## Aural pleasure

This bit was nice and simple once I had the amp and speakers arrive from AliExpress. It was surprisingly difficult to find speakers of the correct size, so I had a three-week wait for them to arrive from China, which was irritating. Connected the amp up to the 5V on the PSU and wired the speakers in and... nothing. I'd forgotten to run a cable from the MiSTer to the amp. Rookie.

## Bells and whistles

And with that I had a working system, but I wasn't done there. As per the video, I added an NFC reader into the fake drive slot and started writing NFC cards with Zaparoo via the MiSTer. These slide into the slot and load the game marked on them instantly, giving me that physical connection to what I am about to play. Remove the card and the system drops back to the main menu. It's lovely.

It's more lovely that I then designed the front and back for the NFC cards and used the EufyMake to print on them in glorious full colour. Big boys' toys.

![Custom NFC game cards for Zaparoo on MiSTer FPGA](/portfolio/features/ultimate-mister/nnfc_cards.jpg.webp)
*Custom NFC game cards for Zaparoo on MiSTer FPGA*

I've also added, probably largely needlessly, a physical CD/DVD-ROM drive now that the system can play actual physical discs in some of the cores, like the Saturn and PlayStation, again connecting me to my media in a way Sony would like to crush me from doing.

The addition of the USB version of the Amiga mouse from the A500 Mini and an original ZipStik joystick connected with a DaemonBite adapter completes the set.

I still need to get my MT32-Pi MIDI emulator working again for classic DOS adventures and some beautiful music. It used to work in its old case but now no longer utters a peep. I am assuming the cable, or potentially even the user port on the I/O board, is borked, but that's a fix for another pay day.

## The dream machine

![The finished ultimate MiSTer FPGA build](/portfolio/features/ultimate-mister/supermister1-768x576.jpg.webp)
*The finished ultimate MiSTer FPGA build*

So that's it then, my ultimate MiSTer FPGA, encapsulated inside something that looks futuristically period.

In an ideal world it would run off my CRTs, and I may well run a secondary cable out at some point to one of them.

The screen at 9.7 inches is small, but having come from an iPad it is glorious, and the machine itself is a feature piece on my desk under my monitor that I can just turn on and off whenever I want.

I've made a lot of stuff in my time, but this is the perfect mix of a variety of my learned skills for me: electronics, 3D printing, UV printing and messing about. It's now in a form factor that can be passed around and down the family without looking like I am trying to jerry-rig an explosive device.

## What is MiSTer FPGA?

If you have spent any amount of time around retro gaming, you will probably have come across MiSTer FPGA. On the surface, it is another way of playing old games, but that description massively undersells what makes it interesting. Rather than simply running software emulators, MiSTer uses a field-programmable gate array, or FPGA, to recreate the behaviour of the original hardware itself. In practical terms, when you switch from an Amiga core to a Mega Drive or an arcade board, the FPGA is being reconfigured to behave much more like that original machine.

That is why MiSTer has become such a big deal among people who care about accuracy. The timing, video output, controller response and little hardware quirks can all be reproduced incredibly closely, and in some cases the experience is about as near as you can get to using the original machine without dragging a 35-year-old computer out of the loft.

It also means one small box can replace an absurd amount of hardware, covering everything from the ZX Spectrum and Amstrad CPC through to the Amiga, Neo Geo, SNES, Mega Drive and a huge range of arcade boards. Hook it up to HDMI and it works happily with a modern display, or go down the CRT route if you really want to disappear into 1989 for the evening.

## How to set up your MiSTer FPGA

MiSTer can look intimidating when you first start reading about SDRAM boards, I/O boards, USB hubs and endless configuration options, but the basic setup is actually fairly straightforward. At its core you need a DE-10 Nano board, a microSD card, a power supply and some way of plugging in a controller or keyboard. You will also want an SDRAM expansion board if you intend to use the more demanding console and arcade cores, and most complete MiSTer systems sold today already include the extras that make life considerably easier.

Once the microSD card has been prepared with MiSTer, you simply boot the machine and let the update scripts do most of the heavy lifting. These will grab the current cores, menus and supporting files, after which you can add your own game images, ROMs and disk files into the relevant folders. Some systems require their original BIOS files as well, but once everything is in place there is very little ceremony involved: choose the system you want from the menu, load a game and start playing.

You can then lose as much time as you like tweaking scanlines, aspect ratios, controller mappings and CRT settings, although the real joy of MiSTer is that you do not have to. Once it is configured properly, it becomes one of those boxes you switch on because you fancy playing something old, and five minutes later you are exactly where you wanted to be.
