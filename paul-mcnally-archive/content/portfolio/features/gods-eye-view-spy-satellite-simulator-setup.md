---
title: "God's Eye View turns your PC into a spy-satellite simulator – here’s what it is and how to set it up"
date: "2026-09-14"
slug: "gods-eye-view-spy-satellite-simulator-setup"
excerpt: "God's Eye View combines live flights, satellites, ships, earthquakes and public cameras in a browser-based global intelligence display you can install yourself."
publication: "The Escapist"
author: "Paul McNally"
tag: "Open Source Technology"
related: "features/dcs-world-beginners-guide-2026"
featuredImage: "/portfolio/features/gods-eye-view/gods-eye-view.webp"
featuredImageAlt: "God's Eye View displaying a photorealistic aerial view of a city through its circular surveillance interface"
micronetImage: "/portfolio/features/gods-eye-view/gods-eye-view-micronet.png"
micronetImageAlt: "Pixel-art Micronet screen showing God's Eye View monitoring live data over Charlotte"
imageCredit: "Halfpixel"
sourceUrl: "https://www.escapistmagazine.com/news-gods-eye-view-spy-satellite-simulator-setup-focus-keyphrase-gods-eye-view/"
---
whether you should actually be allowed to have this.

There is the Earth, sitting in front of you in glorious 3D. Aircraft are moving around it. Satellites are passing overhead. Ships are making their way across the oceans. Earthquakes can appear. Public cameras can be pulled into the mix. You can select things, track them and start digging into what exactly you are looking at.

Flick on one of the military-style overlays and suddenly your PC looks like something from a military bunker and your larping can begin

Obviously, I immediately started cosplaying secret agents,

God's Eye View describes itself as a "spy-satellite simulator in your browser". It's not, however, a game per se, rather a Github project (don't leave yet!) that brings together a wealth of publicly available data such as flights, including broadcating military operations, satellites, shipping and military and folds them all into a militaristic Google Earth on roids.

![God's Eye View map showing a military flight over the Gulf](/portfolio/features/gods-eye-view/gulf.webp)
*Here we can see a military flight operating in the current Gulf crisis zone south of Iran*

The data presented to you is real. Or at least real in the sense that God's Eye View is pulling together public and third-party information about things actually happening around the planet. It isn't a magical CIA terminal and it isn't accessing secret military satellites but it feels like it is.

And because God's Eye View is open source, you can install the whole thing yourself.

## So what actually is God's Eye View?

God's Eye View is the work of Bilawal Sidhu and Sameh Khamis at Halfpixel, and at its heart is a browser-based geospatial visualisation system. It's also [one of the most popular projects on Github](https://github.com/bilawalsidhu/gods-eye-view) right now, and with good reason - I'll tell you how to get it up and running shortly.

What it does is bring a collection of different public data sources together and present them over an interactive 3D representation of Earth.

Instead of opening one website to look at aircraft, another to check ships, another for satellites and yet another for seismic activity, God's Eye View attempts to turn the planet into one enormous interactive intelligence display, and one you get over the scary Github part with a bit of ChatGPT help you are all in.

You can have live aircraft moving around the globe, maritime traffic at sea, satellites orbiting overhead, earthquakes, active fires, cameras and other layers of information. There are also things such as rocket launches and environmental data depending on how far you take your setup.

![Real-time satellite positions plotted around Earth in God's Eye View](/portfolio/features/gods-eye-view/satellites.webp)
*Real-time satellite data in action*

That latter part is important because there are already perfectly good websites for tracking aeroplanes or looking at satellites. God's Eye View isn't interesting simply because it can show you that information, but rather because it brings it all together in an interface you can just leave running, turning off bits and pieces as you go.

You can zoom out and look at the planet, dive towards a city, click an aircraft and begin following it. There is a cockpit mode that effectively lets you ride along with a tracked flight while the terrain moves beneath you. A contacts system can show objects around your current target, while trails and metadata turn clicking around the map into something dangerously close to conducting your own little intelligence operation.

Then there are its visual toys. God's Eye View includes different sensor-style appearances including night vision, thermal-style FLIR, CRT and noir effects. There is a detection overlay capable of drawing boxes and identifiers around visible contacts and, naturally, a military HUD.

You can now see why I am larping

## Pussy Galore

My favourite thing about God's Eye View is simply picking somewhere interesting and seeing what I can find. I very quickly stopped treating the globe like Google Earth and started thinking in layers.

What aircraft are nearby? What's above me - I can hear one right now, where's that going? Are there ships offshore? What cameras are available? What happens if I track that aircraft instead? What's that satellite? That looks suspicious... It changes your relationship with the map.

One moment you are looking at the whole of Europe. A few seconds later you are following an individual aircraft and watching the world move beneath it - the cockpit view is particularly good for this.

Select a suitable aircraft, switch views and God's Eye View positions you with it, turning a little moving marker on the map into something much more tangible. You aren't suddenly receiving a live video feed from the pilot's windscreen, obviously, but the combination of real positional information and 3D terrain is enough to sell the illusion remarkably well. It is Flight Simulator without the flying.

Or perhaps Flight Simulator for people who would rather spend their evening pretending to be Jack Ryan. That's me, that's me.

![A military aircraft trail plotted over a coastline in God's Eye View](/portfolio/features/gods-eye-view/military-flight.webp)
*The military might have a bit more cash if this secret flight didn't waste so much jet fuel, you'd think*

The satellite layer produces a similar effect. Seeing satellite positions plotted around Earth makes something normally completely abstract suddenly understandable. There are an awful lot of objects moving above our heads.

This is where God's Eye View starts demonstrating something beyond being a clever toy. The individual pieces of information are often mundane. An aircraft transponder. A ship beacon. Orbital data. A seismograph reading - yes it shows earthquakes (and fires) using real-time data

Put them all on the same globe, and suddenly you have context - largely of how screwed we are.

That is essentially the idea behind open-source intelligence, or OSINT: useful information doesn't necessarily have to be secret. Sometimes the interesting part is taking information that is already available and connecting it together and that's exactly what's happening here.

Then you can start playing with it!

## It looks more sinister than it is

The clever thing is that God's Eye View looks like something you aren't supposed to have and yet you can download its source code from GitHub.

The project's code is released under the MIT licence, although the various data sources and imagery it uses have their own licences and terms.

The developers are also very clear about the limitations of what you are seeing.

![A dense layer of live flights plotted over Europe in God's Eye View](/portfolio/features/gods-eye-view/flights.webp)
*That's a lot of flights – hopefully somebody has a handle on all that*

This isn't something you should use for actual aviation or maritime navigation, emergency response or anything else where incorrect information could have serious consequences. Feeds can be delayed. Things can disappear. Positions can be inferred or modelled.

The traffic layer, for example, isn't secretly watching every car on the motorway. Traffic is simulated along real roads using aggregate information. Camera positions and some launch trajectories can also be estimates. It's not actually NORAD. It just, well, looks and feels a bit like NORAD.

## Oh yes, you can talk to it too

Now let's make it even more bonkers. You can talk to it too and ask it things about what you are seeing.

God's Eye View supports an optional real-time AI agent (just put the pitchfork down for a second, will you). Once configured, rather than constantly clicking around the interface you can chat to the system.

This is the point at which, if your missus walks in while you are asking your personal spy assistant for information on the White House, she might start looking for numbers to call.

The voice system can be used to interact with the map and its information, while there is also a voice whiteboard system capable of putting annotations, boundaries and routes onto the globe.

You can have a tremendous amount of fun with God's Eye View without touching the AI functionality at all. But there is something enormously satisfying about having a giant tactical representation of Earth on a monitor and issuing spoken instructions to it.

It's basically the computer system I assumed I would own in the future when I was about 12 after watching War Games for the 100th time.

## Building my own God's Eye View

![Datacentres plotted across Europe in God's Eye View](/portfolio/features/gods-eye-view/datacentres.webp)
*In case Elon, Sam or Mark tells you we don't have enough data centres – send them this. This is where all your GPUs and RAM are*

Despite how complicated the finished result looks, getting God's Eye View running is surprisingly manageable.

There are now two sensible approaches to getting your home spy system

The easiest is [Pinokio](https://pinokio.co/), which is designed to install and run projects such as this without requiring you to spend much time mucking around in a terminal. God's Eye View currently requires Pinokio 8.2 or newer. Find the project inside Pinokio, hit Install and then Start.

That's basically it. It works on Windows, macOS and Linux.

## How to install God's Eye View

For anybody who wants to understand what is happening underneath – or intends to start modifying the project – I prefer the traditional route.

You need Git and a compatible version of Node.js. At the time of writing God's Eye View supports Node.js 24.14 or later in the Node 24 branch, or Node 26. Avoid Node 25.

Then clone the repository:

`git clone https://github.com/bilawalsidhu/gods-eye-view.git`

Move into the new folder:

`cd gods-eye-view`

Install its dependencies:

`npm ci`

God's Eye View includes a useful setup check, so next run:

`npm run doctor`

Assuming everything looks healthy, start it with:

`npm run dev`

Then point a browser at:

`http://localhost:4173`

And, somewhat remarkably, there is your personal global intelligence console. One thing worth stressing is that you no longer need to spend half an hour collecting API keys before you can see anything, God's Eye View can now boot keyless.

The basic installation uses Esri satellite imagery and keyless terrain, with OpenStreetMap available as a fallback. Flights, military traffic, satellites, earthquakes, public cameras, radio information and launches can all be explored without immediately signing up for a collection of external services.

That makes the initial experience considerably friendlier and up and running in no time.

## Powering it up

If you do want the prettier and more advanced version, God's Eye View has a wonderfully named POWER UP panel.

This handles optional provider configuration from inside the application rather than forcing less experienced users to go poking around configuration files.

One of the first upgrades worth considering is Cesium ion. An eligible personal, non-commercial account can provide access to photorealistic 3D and world terrain, subject to Cesium's current terms and quotas. This is cool and gives you Google data without the risk of incurring Google API costs but won't let you search anywhere with voice commands - just a few preset cities.

![God's Eye View showing a military flight in green night-vision mode](/portfolio/features/gods-eye-view/military-night-vision.webp)

There is also a Google Maps route using Google's Map Tiles API. That can provide the photorealistic planet along with place searching, but this is the billing-enabled, metered option, so you need to pay attention to Google's current pricing and quotas rather than blindly pasting in a key and forgetting about it.

OpenAI access enables the conversational side of God's Eye View.

Other optional providers can add further data sources, including active fire information and live maritime AIS data.

The clever part is that you don't have to configure everything. God's Eye View is more of a platform than a fixed experience. Start with what interests you and build outwards.

If you love aviation, concentrate on aircraft. If satellites are your thing, build yourself the world's greatest orbital screensaver.

If you want the full superspy experience, well, you know what to do Bond.

There is one security point worth mentioning. Some browser-side API credentials, including Google Maps and Cesium ion, are necessarily visible to the browser. The project's documentation recommends restricting those keys at the provider rather than assuming that because everything is running on your PC they are magically secret.

Don't throw unrestricted API keys into anything and hope for the best.

## Codex makes things even more interesting

This was also one of those projects where using a coding agent such as Codex suddenly makes a lot of sense. The repository itself actively encourages people to extend the project, and its architecture is built around separate data layers. That makes God's Eye View a brilliant playground for the current generation of coding tools.

Want to change the interface? Ask Codex to examine how it is constructed. A new information layer? Get it to work through the existing modules and help build one.

![A Codex conversation containing setup instructions for God's Eye View](/portfolio/features/gods-eye-view/codex-setup.webp)

Want the whole thing running on another machine in the house or permanently displayed on a spare screen? You have the source code sitting there in front of you.

This, to me, is where God's Eye View becomes more interesting than another clever GitHub project you install, play with for 20 minutes and forget. It wants to be messed about with.

You can also just give Codex the following prompt and leave it to set everything up for you:

```
“Set up God’s Eye View from https://github.com/bilawalsidhu/gods-eye-view on my computer. Read the current README, check the prerequisites, install it, and launch the default keyless version. Then walk me through enabling photorealistic 3D and voice in the app’s POWER UP panel. Guide me through any new API keys I need, but keep API keys local; don’t ask me to paste them into this chat. Once it's up and running, please give me instructions to use it.”
```

## The slightly unsettling bit

There is another feeling that creeps in after using God's Eye View for a while. We leak an extraordinary amount of information about the world.

Not necessarily personal information. God's Eye View isn't a magic machine for spying through people's bedroom windows, and it shouldn't be treated as one.

But modern civilisation constantly broadcasts data. The planet here  feels observable. And I think that's ultimately why God's Eye View is so compelling.

![God's Eye View focused on Charlotte, North Carolina](/portfolio/features/gods-eye-view/charlotte.webp)

The impressive bit isn't that somebody has somehow gained access to a secret stream of information. The impressive bit is discovering just how much you can see without having access to anything secret at all.

So install it. Turn the HUD on. Find an aircraft. Follow a satellite. Switch everything into night vision if you must.

Then sit back in your chair, preferably in a darkened room, and pretend somebody in Langley is waiting for your report.

And don't forget, somebody, somewhere is almost definitely watching you do all this, because it is 2026 after all
