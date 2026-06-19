All right. So, today I'm going to talk about the first actionable steps that you can take to building an event- driven AI system. Ideally, that's part
0:088 secondsof like a holistic AI strategy for your company, right? And it's part of the framework that we apply to almost every
0:1616 secondssingle uh build or transformation that we do. That's not kind of like a one-off thing, right? There's a strategy here to
0:2323 secondstransform the company into an AI native operation. And so when you're doing this, you don't necessarily want to build a bunch of scattered agents that
0:3131 secondsare all uh living in different environments or doing different things and there's no cohesion or like a road map to build more modules out or to
0:4040 secondsexpand the capabilities or or to be flexible if you were to change things.
0:4444 secondsAnd so this is based on a lot of conversations, a lot of projects, a lot of battle scars I would say that we have
0:5353 secondsaccumulated over uh the last couple of years. And so part of this framework, we've called it our agentic OS framework. That term has
1:031 minute, 3 secondsnow been co-opted by uh many different parties. So I'm not even sure if it has any kind of like originality anymore,
1:101 minute, 10 secondsbut it is our agentic operating system, our entic OS framework that we apply, right? And it it's born out of this
1:181 minute, 18 secondsissue that I see where it's like most of these business leaders who come and uh you know hop on a call with us and you know they're interested in getting AI
1:261 minute, 26 secondsgoing, they usually come with like a list of agents and they want to just jump straight into building and deploying a bunch of agents, right?
1:351 minute, 35 secondsbecause it's pretty obvious what the pain points might be. You're like, "Okay, maybe if we had something that generated proposals or if we had something that communicated with insurance carriers and submitted claims,
1:441 minute, 44 secondsyada yada yada, right? You have an idea of like what an agent could be, right?
1:491 minute, 49 secondsThat would increase efficiency for the business." But often times the environment that exists to build an agent is not ready. And a lot of people
1:571 minute, 57 secondssay, well, it's like it's called data readiness, right? Or um AI readiness people will call it. And I guess you could say it is data readiness, but the
2:052 minutes, 5 secondsthe real issue is that it's a human bottleneck, right? The real issue is that when you want to build agents that
2:122 minutes, 12 secondsare origentic systems that are integrated with your current stack using your current data, that the data that
2:202 minutes, 20 secondsyou actually store in the truth of source platform where it's supposed to exist. So for sales your CRM for project management whatever project management
2:282 minutes, 28 secondssoftware you have Jira ClickUp whatever you know for legal it's case management software like Cleo Filevine maybe some of the old legacy platforms those
2:362 minutes, 36 secondsplatforms are the source of truth not only for whatever agents that we build or agentic systems that we build but also for the people on your team for the
2:432 minutes, 43 secondshumans and a lot of the hesitation around building either automation or AI systems comes around like well I don't necessarily
2:512 minutes, 51 secondsthink like AI can do that and then you dig in deeper like why don't you think AI I can do that. Well, there's a lot of nuance or there's a lot of judgment calls that are made as we're executing
2:592 minutes, 59 secondsXYZ. But a lot of times that the nuance or that those judgment calls are uh a result of like not having the right
3:073 minutes, 7 secondsinformation or the right data or accurate data or real-time data readily accessible or available in the source of truth platform, whatever it is, right?
3:143 minutes, 14 secondsLike a CRM. And so humans obviously can like put things together. They can talk to other humans. Like we're we're very flexible. And so we can make up those gaps. Let's say you're a new
3:233 minutes, 23 secondssalesperson. You come in, there's a deal that has been worked by another salesperson and you know, you're trying to read up on like where this thing is
3:313 minutes, 31 secondsat. A lot of times you're just not going to get a clear idea on where this deal is at, how you should approach them without talking to the older salesperson, uh, or without starting
3:393 minutes, 39 secondsover from scratch, connecting with that prospect or that lead, right, or that client. And so the data that was in the CRM one is either not useful or it's
3:483 minutes, 48 secondsjust not fleshed out enough to where it's useful for like fully useful for anybody to come in and and take over from there, right? And that's what we're
3:573 minutes, 57 secondsasking like our agents or our aentic systems to do is to come in and take over some of the work that's being done.
4:024 minutes, 2 secondsAnd we're asking it to do it with incomplete data. So, what we've done to make our systems event driven, which is endto-end automation, not just like a co-pilot uh like literally like a
4:124 minutes, 12 secondsco-pilot assistant or not like a co-work setup where you're doing slash commands and you're prompting it to like actually go, but it's truly end to end with maybe
4:204 minutes, 20 secondssome human in the loop escalation points where needed. What we've done and what we apply to all of our projects now is initially doing the capture of the data
4:284 minutes, 28 secondsat the uh origination point which in my mind in my opinion the only points of origination really at the very beginning where data is being created and needs to
4:364 minutes, 36 secondsbe captured are meeting transcripts, emails and internal like messages like with Slack, Discord or Teams like chat
4:454 minutes, 45 secondsor Google chat. Those are the only three sources. You could argue documents and files, but those a lot of times get created based on the conversations that
4:524 minutes, 52 secondswere happening in one of those other channels or they're sent via one of those other channels. And at the very least, you get a notification. Like if
5:005 minutesyou use like Dropbox or something and it goes into your Dropbox folder, you're likely going to get an email notification that something was sent in Dropbox and you need to go download it.
5:095 minutes, 9 secondsOr a calendar event. If a calendar event happens, you're likely going to get a an email notification saying that this calendar event has happened. And so
5:175 minutes, 17 secondsalthough you you when you're building out certain workflows, you want to have some web hooks and stuff for other platforms, when we're talking about the
5:255 minutes, 25 secondscleanliness, the contextualization of data, ensuring that it's all there, all fleshed out, fully provisioned in the
5:335 minutes, 33 secondsright way in whatever source of truth platform it's supposed to go to. I think that those three are the only channels that really matter for the most part. So
5:415 minutes, 41 secondsthere's that. What we want to do initially is to capture the data that comes in via those channels. We want to match it against records that exist in the source of truth platform like a CRM.
5:525 minutes, 52 secondsUh and then we want to update that record in said platform, right? Which sounds easy enough and it largely is but there's a little bit of like testing and
6:006 minutesvalidation that needs to happen. And so a lot of times we'll have like a human in the loop step where we're really making sure like okay does this, you
6:076 minutes, 7 secondsknow, we're doing it for legal. does this email actually match to is it actually associated with this matter in your case management software and
6:156 minutes, 15 secondssometimes it can be confusing and sometimes the uh LM may not have enough context and so as we're building it out these are the things that we're testing
6:236 minutes, 23 secondsright just to make sure that as everyone's emails are coming in can we contextualize it properly and then can we store that information where it needs to go in the source of truth truth
6:326 minutes, 32 secondsplatform not only so the humans can have access to it and they're up to date but when we start to build actual workflows using that data we have everything we
6:396 minutes, 39 secondsneed there, right? We know nothing's missing. So, a lot of times, actually almost every time, that's where we will start. And so, almost every business essentially runs on events, right? An
6:486 minutes, 48 secondsemail message, a Slack message, um sometimes like a document gets signed and that's an email notification or meeting gets held and there's a
6:556 minutes, 55 secondstranscript that comes on. uh and rather than relying on a human to remember to like log that information, the operating
7:037 minutes, 3 secondssystem reacts automatically and provisions that runs it through the pipeline and provisions it where it needs to go, right? And so a super
7:117 minutes, 11 secondshighle diagram uh or framework that we apply is okay, an event happens, then we ingest it and we dduplicate it, right,
7:197 minutes, 19 secondsagainst like let's say that multiple people on the team are on the same email thread. Well, we want to make sure that we're not duplicating that event across
7:277 minutes, 27 secondsall of the users who received that event. So, we're going to do we're going to ddup it. Then, we're going to fetch and we're going to clean the data. A lot of times emails come in with messy uh
7:357 minutes, 35 secondsHTML or random like images that were part of the signature. And so, we'll clean that and then we'll match it to a quote unquote work item. So, a work item
7:437 minutes, 43 secondscan be a deal record in the CRM. It could be a project in a project management software. It could be a case in a case management software. It could
7:507 minutes, 50 secondsbe a candidate and or a job role in an ATS system. It could be a candidate. And so we want to match whatever event
7:567 minutes, 56 secondshappened to whatever work quote unquote item that it's associated with. And then we obviously want to do a confidence check, right? How confident are we that
8:038 minutes, 3 secondsthis is an actual match to the right work item? And if we're low confident, so we have like a certain confident score that has to pass. If we're low
8:118 minutes, 11 secondsconfidence here, we're going to escalate to the humans so they can help out in the actual matching and pushing to the source of truth. Obviously, if the confidence is high and there's an
8:198 minutes, 19 secondsexisting match, we're going to just push it and update that record. If there is not an existing match in the system, we're going to create a new record for
8:278 minutes, 27 secondsit, right? If it makes sense, uh, a lot of times that's human in the loop step, but if it makes sense, we'll create a new record for it, push the update to that new record that we just created.
8:368 minutes, 36 secondsAnd then we're going to see if there's any or if there are any workflows that need to be executed as a result of this event coming in. And so each workflow
8:448 minutes, 44 secondshas its own state machine keeping up with where things are, what what it's waiting for. There's a lot of pending states happening, especially back and forth communication and scheduling. And
8:528 minutes, 52 secondsso as an event comes in like a response, hey, you know, here are my available dates. Thanks for asking. We know like okay, the scheduling is is associated
8:598 minutes, 59 secondswith this like this case and it's in this stage of like the scheduling and comm's workflow. And so we're doing a workflow match as well and then also the
9:089 minutes, 8 secondsconfidence score based on the workflow match as well. And then it's only at that point where the actual like AI agent or the agentic system is even
9:169 minutes, 16 secondsrunning. And then in between that workflow can be, you know, a hundredstep workflow. It could be a two-step workflow. It could be an agent with a
9:239 minutes, 23 secondsbunch of tools and instructions that has a little bit of flexibility and freedom to do whatever it wants. Uh it could be a highly deterministic workflow that has
9:309 minutes, 30 secondszero LLM additions. So this this most of what people are talking about is the actual workflow part of it. there's
9:389 minutes, 38 secondshuman in the loop steps as well, but the actual workflow part of it when the reality is you need the scaffolding around it to make sure that it works,
9:459 minutes, 45 secondsyou know, in the long run over time. Uh, and it's future proof, right? And you can build on top of it because now that we're getting all these events, we can start to build more workflows based on
9:539 minutes, 53 secondsthese events. And a lot of times what this does is it just opens up a lot of like brain space for the team that's especially sales teams that that have to
10:0110 minutes, 1 secondlike update CRM, especially project management. Honestly, any team really that has to like update a source of truth recordkeeping system, it it it unlocks a lot of brain space for them.
10:1210 minutes, 12 secondsNow, there is something to be said around like, well, you actually making the note yourself allows you to like remember things more, but I do think
10:2010 minutes, 20 secondsthat there's going to be a weird change in how we we think about what we need to remember for work. I mean, I've even
10:2810 minutes, 28 secondsgotten to a point where I'm not really taking notes on calls anymore. the the notes are being taken themselves, right?
10:3410 minutes, 34 secondsWhereas I used to have to take notes on calls because if you didn't take a note on call, you're going to totally forget everything. So like I've already kind of like removed that need out of my brain
10:4310 minutes, 43 secondsof like, man, I really got to make sure like I remember this on the call or else I'm going to forget. So now I don't even think about that. I just think about how
10:5010 minutes, 50 secondsmuch data, how much information can we create or can I extract or can I give so that way the notes are really
10:5810 minutes, 58 secondscomprehensive later post call. And so it's a little bit of a different shift and it was a slow shift, right? It wasn't like immediately immediate, but you notice that when you start to have
11:0611 minutes, 6 secondssystems that are using that are you you know that it's listening on a call or you know that it's capturing your email,
11:1311 minutes, 13 secondsyou start to be very aware of man, if I just add like some more information or if I just like repeat this for the group
11:2011 minutes, 20 secondslike in a very concise way, very clear way, that's going to help the transcript later which is going to help everything else downstream, right? And so it forces
11:2811 minutes, 28 secondsyou to kind of like share more than usual, but then also be very clear in what you're talking about, right? You don't want to leave things up
11:3711 minutes, 37 secondsfor ambiguity. Anyway, that's kind of what I noticed. And I've noticed this with a lot of the teams that we work with as well, where it's it's opening up space for them to think about other
11:4511 minutes, 45 secondsthings or to do other things. Uh and it's also just nothing is falling through the cracks, right? And so the
11:5211 minutes, 52 secondsnext layer here uh that we apply is really really helpful which is like um a checklist. So a lot of times if you're
12:0112 minutes, 1 secondworking a case, if you're working a deal, if you're working a project, uh if you're working anything, right, there's either a pipeline or a checklist that
12:0912 minutes, 9 secondsyou have to follow. And sometimes these checklists aren't written down by the company already, but you kind of challenge them of like, okay, you know,
12:1612 minutes, 16 secondsyou guys get a project in uh what's what are the checklist of things that need to happen, right? And maybe that exists in a variety of SOPs or in people's heads.
12:2412 minutes, 24 secondsBut if you can extract that that checklist which says, okay, if someone were to come in and like run an audit on
12:3212 minutes, 32 secondsa project or on a deal or on a case and they want to run an audit on like where it's at in the process against what
12:3912 minutes, 39 secondsshould be done, what are those things that should be done? What is this checklist of of things that somebody should be working off of? And so once we're able to do the data
12:4812 minutes, 48 secondssynchronization to make sure the data is true and real, nothing's falling through the cracks, we then can apply what we call like a monitoring workflow or an
12:5412 minutes, 54 secondsaudit workflow that will go through the source of truth platform and on a consistent basis audit the work that's
13:0213 minutes, 2 secondsbeing done by the humans. Audit the work that's being done based on the data that exists. That way leaders, ourselves, the
13:1013 minutes, 10 secondspeople doing the work, everyone's aware of where things are at. Right? too many times like things fall through the cracks, you forget to do something, people miss an email, whatever, right?
13:2013 minutes, 20 secondsThis allows for things not to fall through the cracks. It makes the team, the human team just naturally more efficient, right? They they forget fewer things. It's almost like a manage
13:2813 minutes, 28 secondsmanagerial layer and it does help a lot of managers themselves, right? See where things certain things are at. But what it does, the hidden benefit really is it
13:3613 minutes, 36 secondsit clears the way on what are the AI workflows, AI systems, agentic workflows, agents, whatever that need to
13:4513 minutes, 45 secondsget built, right? Because if you have this checklist, you know what needs to get done. You got the data coming in. It's true. It's real. It's real time. It's contextualized.
13:5213 minutes, 52 secondsNow you have the humans still doing the work and you're you're monitoring their work. You're making sure that that audit is true. It's real. It's accurate. And
14:0014 minutesthen now you can start to say okay what are the humans doing to check off each of the boxes in the checklist. And that's where you start to build the
14:0714 minutes, 7 secondsindividual workflows. And then it's only at this point where building an agent where looking at that list of agents actually makes sense. Right? You have to
14:1614 minutes, 16 secondsbuild the foundation first. You have to make sure that you're capturing all the data, contextualizing, storing it correctly, monitoring the work that's getting done uh even by the humans that
14:2514 minutes, 25 secondsare currently doing the work. that you have a way of actually monitoring that work that you have a way of defining success or uh auditing whether or not
14:3314 minutes, 33 secondsthey're doing a good job. It's only once you've set those foundations where you can actually start to build the workflows. And those workflows can look,
14:4114 minutes, 41 secondslike I said, many different ways. It could be an agent with a bunch of tools.
14:4414 minutes, 44 secondsUh it can be like a Hermes agent. It could be a hard-coded deterministic automation with zero LLM capability. It
14:5314 minutes, 53 secondscan be a two-step automation with LM capability that like generates a document or something and escalates it to the human for review. I wanted to make this video because there's a just
15:0115 minutes, 1 secondan influx of teams that are pretty sophisticated when it comes to AI tooling and and like claw and like a lot of people are up on it now. But the
15:1015 minutes, 10 secondsanxiety is like, okay, where are we going with this? How do we get more efficient with what we're doing? How does this like wrap into the whole strategy that we're executing or trying
15:1815 minutes, 18 secondsto execute? If we even have a strategy, what should be our strategy? weren't even the starting point. We we tried a project before but it just like didn't
15:2615 minutes, 26 secondswork and it's like well it didn't work because the data it's working off of is not there. And really what you're trying to do is like solve a problem. You're
15:3315 minutes, 33 secondsyou're looking at a big system and you're trying to solve like a piece of a problem within that system without realizing that the whole system is on a
15:4115 minutes, 41 secondsstring and the dependencies that need to be taken into account when solving that one piece are pretty pretty wide, right?
15:4815 minutes, 48 secondspretty like the it's a it ends up being kind of like a rabbit hole that you're going down when you're trying to um solve like a peacemeal problem without
15:5615 minutes, 56 secondssolving the foundation first. You have to do so many different things. You have to you have to jump over hurdles for this or that. Uh and it's really not simple and and it almost you almost end
16:0516 minutes, 5 secondsup building just brittle systems that aren't going to last long term because you just try to go straight for the for the gold without building it from the ground up. And honestly building it from
16:1316 minutes, 13 secondsthe ground up just doing the data synchronization and pushing it to the source of truth platform whatever it is is immensely valuable for most companies
16:2016 minutes, 20 secondsperiod just that especially leaders when who they who would like to pull insights from that information in that data right at least you know that it's real at
16:2916 minutes, 29 secondsleast you know that it's accurate and then now let let's add in a layer where we're actually monitoring the work and seeing how the work is getting done or
16:3716 minutes, 37 secondsif the work is getting done where the inefficiencies are there right can we pull insights in that way. Now you just have way more knowledge, way more
16:4516 minutes, 45 secondsclarity on exactly where AI is going to make any sense to like start to replace the doing of work part of it, right?
16:5316 minutes, 53 secondsWhich is the exciting thing. It's the thing that everyone talks about is the vision, but there's a couple of steps, couple of layers that you need to put
17:0017 minutesdown if you really want to get there, right? And so super high level wanted to get into this because I think it's
17:0717 minutes, 7 secondsreally important. Uh so let me know what you guys think if you've applied something similar. I don't think it's anything complicated. I don't think it's like proprietary. I think it's simple.
17:1617 minutes, 16 secondsIt's elegant. It makes sense. Um and I and I just see a lot of people just over complicating stuff. You don't need to over complicate it, but you do need to
17:2417 minutes, 24 secondswrite make the right steps every step along the

Sync to video time