Chapter 1: Intro
0:00There are levels to AI coding. Beginners are prompting. They're waiting for their agents to finish. They're reviewing the work and then they're prompting again.
0:099 secondsBut experts figured out how to automate the entire workflow. And in this video, I am going to show you what the absolute
0:1818 secondsexperts are doing. So, this is all of what we're going to be going over in this video. But first, which tools do you use to start? So, I use all of the
Chapter 2: Coding Tools
0:2727 secondsagentic coding tools out there. I have to. It's part of my job and so I've tested and have experience with all of
0:3434 secondsthem. Right now my two primary coding agents are Cursor and Codeex. Cursor is definitely one of my favorite for
0:4242 secondsmultiple reasons. Number one, you can have models from different AI companies.
0:4747 secondsOpenAI, Anthropic, even Cursor themselves has their own model. And not only that, Cursor was one of the first to have cloud agents. And I'm going to
0:5656 secondsget into more details about what cloud agents are, but just know it's a really great feature. So, this is Codex.
1:011 minute, 1 secondDefinitely one of the best coding harnesses out there. What I like most of all about it is first of all, the design. It's beautiful. And second, it
1:091 minute, 9 secondsis able to describe what it's building in a really concise way. And just the overall interaction with the model, the
1:161 minute, 16 secondsvibe of the model is great. I really appreciate how concise the explanations are. So, you can see that right here. It
1:241 minute, 24 secondsruns commands, then it gives you a one to two sentence summary of what it just did and so on and so forth. And that's what I really appreciate. I cannot stand
1:321 minute, 32 secondshaving to read essays about what the agent is doing. I want it short and sweet. Now, Claude Code is great. I
1:391 minute, 39 secondsdon't use it all that often just because I ran out of quota so quickly and so frequently, I just stopped using it as
1:461 minute, 46 secondsmuch. Devon is fantastic and Factory are all fantastic options. Highly recommend all of them. They all have different
1:541 minute, 54 secondsharnesses. They all have different pros and cons. You just need to go out and use them and figure out what works best for you. Next, we're going to be talking
2:012 minutes, 1 secondabout rules, agents.md, and also claude.md.
2:082 minutes, 8 secondsSo, what are these? These are the ways to tell these tools exactly how you want them to work. Exactly what your workflow
2:162 minutes, 16 secondsis, how you like your commit structured, how you like your commit messages written, the personality of the model when it's replying back to you, your
2:252 minutes, 25 secondscoding preferences in general. This is where you define them. Now, basically all of these tools support agents.md
2:322 minutes, 32 secondswith the exception of cloud code. They have their own cloud.md.
2:362 minutes, 36 secondsCursor has rules, but it's basically just writing to the agents.mmd file, and it very much does support agents.md. All
2:442 minutes, 44 secondsright, so if you're going to be using it in cursor, go ahead and go into preferences. Then on the left side, you're going to click this little
2:512 minutes, 51 secondsbutton, rules, skills, sub aents, and then right here are where the rules are written. So if I click into one, here we go. Keep responses short and simple.
2:592 minutes, 59 secondsAvoid showing code snippets. I can just click in and see it. Respond in plain English only. Avoid talking about specific parts of the code. Then we have
3:083 minutes, 8 secondsour project approach. Avoid writing one-time scripts and permanent files. Don't mock data except for tests, etc.
3:153 minutes, 15 secondsAnd then of course we have the agents file right here. These are actually learned preferences that cursor writes to as you use it. And you can just add
3:233 minutes, 23 secondsan agents.md file to any project that you're working on. You can define exactly how you want the model to behave, exactly what your workflow is,
3:303 minutes, 30 secondsyour deploy process, everything. That's where you put it. And so if you're not using agents.mmd, I highly recommend you
3:383 minutes, 38 secondsdo. Just start with the vibe of the model, the personality of the model, define how you want it to behave and talk to you. And then from there, you can learn what you like to do. All
Chapter 3: Skills
3:463 minutes, 46 secondsright. Next, one of the most important things that you need to use skills. I cannot stress this enough. You want to
3:553 minutes, 55 secondsuse a lot of skills. Anything that you do more than once, make it into a skill. Go browse offtheshelf public skills.
4:044 minutes, 4 secondsThere are so many great ones you need to use. They are so very important. And so here are some examples of what you're
4:114 minutes, 11 secondsgoing to use skills for. First, anything that you do more than once. If you do it more than once, it should have been a
4:184 minutes, 18 secondsskill to begin with. You create the skill and rather than having to, let's say, copy paste a prompt over and over again, you simply type slash and then
4:264 minutes, 26 secondsinvoke the skill and then it will do that thing for you, whatever it is. So, here's an example. I type slash. It brings up a list of commands and skills.
4:354 minutes, 35 secondsAnd what we're going to do is we're going to type auto review. Hit enter.
4:404 minutes, 40 secondsAnd then hit enter again. And now that skill is invoked, and it's going to do the auto review skill. And next, one of the most important tools that I use for
Chapter 4: Sponsor
4:484 minutes, 48 secondsreviewing all of the code that AI is writing for me is Grapile. Grapile is fantastic. They're also the sponsor of
4:564 minutes, 56 secondsthis video. Let me show you how I actually use them in my coding workflow.
5:005 minutesSo, I have a Gravile account. I connect it to every new repository that I create and it automatically does this
5:085 minutes, 8 secondsincredible thing. As soon as a PR is opened, Grapile goes in and starts reviewing the code. Check this out right here. So, here's a PR that I opened.
5:185 minutes, 18 secondsFixed skill import context and scan false positive GPL summary. It gives me a summary of what changed. It also gives me a confidence score 0 through five.
5:295 minutes, 29 secondsAnd that is the confidence that if I merge this code, if I merge this PR, it's going to land successfully and there's not going to be bugs or errors.
5:385 minutes, 38 secondsAnd it details the different files that changed and what changes were made to them. It gives me a nice flowchart of what was changed and the pieces of code.
5:475 minutes, 47 secondsAnd then it tells me specifically issues that it would fix and gives me a prompt
5:545 minutes, 54 secondsto copy paste into AI to fix it. Reptile is used already by the biggest companies in the world including Nvidia, Compass, WorkOS,
6:026 minutes, 2 secondsZapier, Brex, Scale. So many different companies use Grapile. I highly recommend it. I'm going to drop a link down below so you can go check them out.
6:126 minutes, 12 secondsLet them know I sent you. It really does help our channel to let them know that I sent you. So, please go check them out.
6:186 minutes, 18 secondsThey've been a great partner. Links down below. Next is when you have domainspecific rules. So, if your company has a
Chapter 5: Skills (cont.)
6:276 minutes, 27 secondsspecific writing style, if you have a certain way you like to write up GitHub issues, if you have certain company information you want to provide to the
6:346 minutes, 34 secondsagent, do that all within a skill. Next, and maybe one of the most important uses of skills, tool instructions. Tools are
6:436 minutes, 43 secondsexecutable pieces of code that can be called from a skill. So if you have a specific way that you kick off tests,
6:516 minutes, 51 secondsfor example, or if you want to only write a subset of the test or how to use a certain API or CLI, all of this can be
7:007 minutesdefined in a skill and that's how you use it. You don't have to redefine all of it. You don't have to provide that context about what the API endpoints are, what responses it should expect.
7:107 minutes, 10 secondsIt's all going to be defined in that skill that you can just reuse as many times as you want. And the cool thing is the agents can actually discover and
7:187 minutes, 18 secondsdetermine which skills it should be using at runtime. So you don't actually have to say slash, you know, whatever the skill is, the agent will know when to use it. And then last, quality gates.
7:297 minutes, 29 secondsSo if you want to say, okay, before we open a PR, I want to run all tests locally and I want to make sure we have 100% pass rate and if we don't pass, fix
7:387 minutes, 38 secondsthe test. If you want all of that process defined and easily invoked, you can put that in a skill. And by the way,
7:457 minutes, 45 secondsthere are tons of off-the-shelf skills that you can use right now. So, for example, here's one called agent skills.
7:527 minutes, 52 secondsIt has 61,000 stars on GitHub, and it gives you everything you need for your development cycle. Everything from refining an idea to specking the PRD,
8:018 minutes, 1 secondimplementing the code, testing, QA, and deployment. It's just all there. It has very opinionated ways of doing things.
8:088 minutes, 8 secondsSo if you like that, great. Just use it.
8:108 minutes, 10 secondsAll you have to do is grab the URL, go to cursor, go to codeex, go to factory, wherever you want, put it in and say install this skill. And then you just
8:188 minutes, 18 secondshit enter and it's going to install the skill for you. You really don't need to do anything else. And then it'll be available. Sometimes you have to restart the software for the skill to become
8:278 minutes, 27 secondsavailable, but that's about it. The next two things I want to talk about are different but very related. automations
Chapter 6: Automations
8:348 minutes, 34 secondsand loops. Automations allow you to prompt your model automatically depending on some trigger. I'm going to show you what that means. And loops
8:438 minutes, 43 secondsallows your agent to run indefinitely until it hits a certain goal. And I'm going to show you that specifically as
8:508 minutes, 50 secondswell. This is what the best of the best agent coders out there are using. So in most tools, I'm going to show you this in cursor and in codeex, there is a first class feature called automation.
9:019 minutes, 1 secondSo this is cursor in the top left. I have this automations right here. We're going to click it. And what we can do is click this create new automation button
9:109 minutes, 10 secondsright there. The first thing you need is a trigger. Then you're going to give your agent instructions, a prompt. And then you can also include memories or
9:199 minutes, 19 secondsadd tools or MCP servers. We'll keep it simple. So, as I just showed you with Greile, I want my agent after Gretile
9:279 minutes, 27 secondsleaves its comments to automatically review the comments, fix them, and then resubmit the PR. And so, let's just automate that. Let me show you how. The
9:369 minutes, 36 secondstrigger, we'll select GitHub, and we can see pull request opened. So, that's when a pull request gets open. Now, there's
9:449 minutes, 44 secondsone problem. the pull request will get open and trigger the automation, but Greile may not have had enough time to actually review the code. So, what do we
9:529 minutes, 52 secondsdo? We'll just say wait until you see Greile's comments on the PR. Now, because I wrote that, it will literally
10:0010 minutesjust wait, which is nice. Then, once you do, go through each of them, each of the comments, and address the comments. Once
10:0710 minutes, 7 secondsyou're done, push the new code back to the PR. And that's it. Now, every single PR that opens, Gretile will review it.
10:1510 minutes, 15 secondsThis agent will wait until the comments are there from Grapile. Then it will address the comments and push the code.
10:2210 minutes, 22 secondsMake sure you're selecting the right repo. So, I'm going to select AstroHub by anyone. And then last, before we create this cursor does this cool thing
10:3010 minutes, 30 secondswhere it automatically identified tools that we might need to make this automation work. So, it highlighted this address the comments. Some tools might
10:3910 minutes, 39 secondsnot be configured yet. Let's click tools, go down to the GitHub tool, comment on pull request, and then we're done. Hit create and that's it. Now we
10:4810 minutes, 48 secondshave that running automatically. Super useful. And also in codeex, it's kind of the same thing. Click up here to automations. You can either create via
10:5610 minutes, 56 secondschat and just describe in natural language the automation you want or you can click this dropown, create it manually, and then you use a title. You
11:0611 minutes, 6 secondsadd the prompt. You can select which repo down here, how it's scheduled. You can give it memories and tools. It's
11:1311 minutes, 13 secondsvery similar to how they do it in cursor. I cannot recommend using these automations enough. If you again are typing the same thing over and over
11:2211 minutes, 22 secondsagain or you're doing the same process over and over again, automations are the way to save you a ton of time. Now,
Chapter 7: Loops
11:3011 minutes, 30 secondslet's talk about loops. And in fact, I've been thinking so much about loops, I actually created a loop library, which I'm announcing for the first time today.
11:4011 minutes, 40 secondsIt is a completely free library of loops that I have used that I found others have used. And if you have your own
11:4711 minutes, 47 secondsloops and want to submit them, you can do that. So, here it is.
11:5011 minutes, 50 secondsSignals.future.ai/loop- library. I know it's long. I'll drop it down in the description below. All you
11:5811 minutes, 58 secondsgot to do is bookmark it. Here's the loop library. and we have a few right now, but I'm going to be growing this list and you can always come here. It
12:0512 minutes, 5 secondswill always be free and I'm hosting it on here. Now, so thank you to them for hosting and partnering with me on the loop library. All right, so what is a
12:1412 minutes, 14 secondsloop? Well, it's kind of exactly what it sounds like. You have some kind of process that loops over itself, right?
12:2112 minutes, 21 secondsOver and over again. Very simple. But what does that actually mean? A loop contains three things. One, some trigger to start the loop. two, some action that
12:3012 minutes, 30 secondsit does over and over again. And then three, some goal, some end goal so that it just doesn't run forever and the loop
12:3912 minutes, 39 secondswill stop once that goal is met. Now, back to the loop library. What does that actually mean in practice? A lot of people talk about this in very handwavy
12:4712 minutes, 47 secondstheoretical ways, but I wanted to actually give you very concrete, practical loops that you can start using today. And I'm also going to explain why
12:5512 minutes, 55 secondsautomations and loops kind of go hand inand a lot of times. They don't always need to, but it's nice to be able to kick off a loop automatically. So here's
13:0313 minutes, 3 secondsan example. This is the overnight docs sweep loop. Basically what it does is it says each night review the codebase in full and make sure all documentation
13:1213 minutes, 12 secondsreflects the latest changes from the previous day. Update the documentation as needed. Then open a poll request with those changes. The point is to keep all
13:2013 minutes, 20 secondsof the documentation in my app, whether it's the public facing readme or internal documentation, as upto-date as
13:2813 minutes, 28 secondspossible at all times. And so I run this in an automation, and I say, "Okay, at 1:00 a.m. run this automation." So it
13:3613 minutes, 36 secondslooks at all the changes that I made from the previous day, compares it to the documentation, and sees if there are any gaps in the documentation, and
13:4413 minutes, 44 secondsupdates them appropriately. Here's another amazing one that has really just saved me a ton of time. This is called the sub50ms
13:5313 minutes, 53 secondspage load loop. I basically set up a loop for my agent to go through my entire app, load every single page,
14:0114 minutes, 1 secondevery single modal, every single sidebar, everything. And if any one of them loads in over 50 milliseconds, I
14:0914 minutes, 9 secondswant it to optimize the queries, optimize the website, do whatever it needs to do to make sure every single
14:1614 minutes, 16 secondsthing loads in under 50 milliseconds. So the loop is continue until everything
14:2314 minutes, 23 secondsloads in under 50 milliseconds. And I've had this thing run for hours and hours and hours. And it really does help. When
14:3114 minutes, 31 secondsit was finally finished, the app was lightning fast. Now, I want to show one more loop. And again, I'll drop a link
14:3914 minutes, 39 secondsto the loop library down below so you can check out all of them. And please submit your loops if you have awesome loops that you use all the time that are generalized and anybody can use them.
14:4814 minutes, 48 secondsPlease go submit them. So, this is called the production error sweep. I do this every single night. I have an agent kickoff that looks at our production
14:5614 minutes, 56 secondslogs and looks for any errors and analyzes the error, tries to figure out what caused it, writes up a fix for it,
15:0415 minutes, 4 secondsand then submit a PR. And so anytime there's an error, and I really do have full log coverage, which I would highly recommend. I'll get to more of those
15:1215 minutes, 12 secondstips later, but any error that happens, any error that shows up in the log, when I wake up, there's already a fix for it.
15:1915 minutes, 19 secondsIt's so cool. All right. So, now that you know about automations and loops, let me give you some quick best practices. Essentially, there is no
Chapter 8: Best Practices
15:2815 minutes, 28 secondsreason to have suboptimal code at this point because you can have 100% test coverage at all times. You can kick off
15:3615 minutes, 36 secondsan automation that checks if you do not have full coverage and if you don't, write tests to make sure you have full coverage. There is really no reason not
15:4415 minutes, 44 secondsto. There is no reason to have stale or missing documentation for the same exact reason. You kick off an agent and make
15:5215 minutes, 52 secondssure all of the functionality in your app every single day as it changes gets updated in that documentation. I cannot
16:0016 minutesrecommend that enough. And then last, have exhaustive logging. Log everything.
16:0616 minutes, 6 secondsIt really doesn't cost that much. You can always have some like 30-day window for logging or 7-day window for logging, but you want to store all logs because
16:1416 minutes, 14 secondsyou could just task your agent with fixing any errors that come up. It's so brilliant this flywheel of perfect test, perfect documentation, and perfect
16:2316 minutes, 23 secondslogging. Have these three in your codebase. I cannot recommend this enough. All right, next let's talk about cloud verse local agents. Most AI coding
Chapter 9: Cloud vs Local
16:3216 minutes, 32 secondstools have both. The big ones that you've heard of definitely have both.
16:3716 minutes, 37 secondsCursor was really the first one to have cloud agents, but Cloud Code has it, Codeex has it. And what it basically
16:4416 minutes, 44 secondsmeans is that you can spin up a completely isolated environment for your codebase for each individual agent and
16:5216 minutes, 52 secondsit's not running on your computer. And this is really good for a lot of reasons. Number one, it is infinitely parallel because you're not depending on
17:0017 minutesthe CPU or the RAM of your computer, your home desktop or laptop to run a ton of agents in parallel. You're using the
17:0817 minutes, 8 secondscloud. You are using a massive data center to power this. So, you really don't have to think all that much about hm can I spin up 10, 20, 30 agents?
17:1817 minutes, 18 secondsIt'll just work. Next, it is accessible from anywhere. Most of these AI tools have mobile apps and you can log in and
17:2617 minutes, 26 secondsmanage your cloud agent from anywhere and it's very useful for coding on the go. Now, of course, Cloud Code and Codeex both allow you to control your
17:3517 minutes, 35 secondslocal agents remotely, but again, you start running into some of those bandwidth constraints because you're running it locally. Next, one of the
17:4317 minutes, 43 secondsmost important reasons to use cloud agents is that they run on completely isolated environments. Which means if
17:5017 minutes, 50 secondsyou have multiple agents all writing to the same repo, they're not going to conflict with each other, which is an issue that I have all the time. Even if
17:5917 minutes, 59 secondsI am spinning up new work trees locally for every one of my agents, I still run into these weird edge cases and it
18:0718 minutes, 7 secondsdoesn't always work flawlessly like it does if you're using a cloud agent.
18:1118 minutes, 11 secondsAlso, when you use cloud agents, there are some really unique features dependent on which AI tool you're using.
18:1818 minutes, 18 secondsFor example, cursor has this incredible feature that gives you a video and screenshots of the changes it made. You
18:2718 minutes, 27 secondsdon't have to ask for it. It just does it. So rather than just trusting that it got something done, you can actually see
18:3318 minutes, 33 secondsit. Check this out. So here it is. I added a new loading icon to my app and we can see there it is. And it literally
18:4218 minutes, 42 secondsjust showed me a video of it. So really cool, useful feature. Now, there are some drawbacks to using cloud agents.
18:4818 minutes, 48 secondsLet me tell you why sometimes local is better. Number one is it's faster. It is much faster because you always have an
18:5618 minutes, 56 secondsenvironment ready to go on your local machine versus the cloud which has to spin up a new environment for every single agent that you kick off. And
19:0519 minutes, 5 secondsthere's a little bit of latency that you pay there. It's not huge, but it is something. Number two, you get more control when it's running on your own
19:1319 minutes, 13 secondscomputer. When you can actually see the files being changed on your own computer, you do have a better sense of
19:2119 minutes, 21 secondscontrol over what's going on. Also, cloud agents don't always have the latest and greatest features released by
19:2819 minutes, 28 secondsthese AI coding tools. So, most likely the latest and greatest features are going to ship with your local agents and then later show up in the cloud. But to
19:3619 minutes, 36 secondsbe honest, I am most likely going to be moving my entire workflow to cloud agents. There are just too many benefits to moving all of this to the cloud.
19:4419 minutes, 44 secondsEspecially when you start running a bunch of agents in parallel, which you know, when I'm running 12, 15, 20 agents
19:5219 minutes, 52 secondsin parallel on my computer, my computer slows to a crawl. There is no avoiding it. Now, I mentioned work trees. I just
20:0020 minuteswant to touch on that one more time. All right. So, what is a work tree? A work tree is a second working folder,
20:0720 minutes, 7 secondsbasically a copy of your repo that is separate from your other one. So I typically spin up work trees for every
20:1620 minutes, 16 secondsagent. And so that means each agent can make changes to the same set of files to the same methods and then the merge when
20:2420 minutes, 24 secondsI finally merge it later, that's when we're going to resolve all the conflicts. The problem with not using work trees is if you have a bunch of
20:3120 minutes, 31 secondsagents and they start writing to the same file, they're going to get confused and they're going to spin out of control. It's very frustrating. So try to use work trees as much as possible.
20:4220 minutes, 42 secondsNow there is some latency that you pay with using work trees, but overall there really isn't much downside to just using work trees for all of your agent
20:5120 minutes, 51 secondsthreads. Now work trees are very easy to spin up. Here it is in cursor. So here's my repo. Here's the branch that I'm
20:5920 minutes, 59 secondsusing. And right here where it says cloud, this is if you wanted to spin up a cloud agent, you can select just the repo itself. And all of the agents are
21:0621 minutes, 6 secondsgoing to work in the same work tree. And if you click right here, new work tree, that allows you to spin up a new work tree for that agent. And so that's it.
21:1421 minutes, 14 secondsYou're done. It's that easy. In codeex, very similar. Right here where it says cloud, you click it. Instead, you click new work tree. Okay? And it
21:2321 minutes, 23 secondsautomatically selected main. But that's it. Then when I kick it off, as you can see with this thread, this one's using a work tree. Now, the times that you
21:3121 minutes, 31 secondsreally don't need work trees is if you have agents running on completely different areas of the codebase. One last note about cloud agents. Make sure to set them up with a full environment.
21:4221 minutes, 42 secondsThe same thing you would give your local environment. So local keys.mm.local all of the things that you would give to
21:5121 minutes, 51 secondsyour local environment to make sure that it runs well to make sure it has access to the different tools it needs. You also need to do that in the cloud
21:5921 minutes, 59 secondsenvironment. Each one cursor, codeex, cloud code, factory, they all have interfaces on the web in which you can
22:0722 minutes, 7 secondsgo in and input your client secrets, input your environment variables, and you want to treat that as its own
22:1422 minutes, 14 secondsenvironment and give it full power by doing so. All right. Now, one of the benefits of using a cursor or a factory
Chapter 10: Multi-model
22:2222 minutes, 22 secondsor a Devon is that you have multi-modal functionality. That means you're not completely dependent on an open AI model
22:3022 minutes, 30 secondsif you're using codeex. You're not completely dependent on using an anthropic model if you're using cloud code. That's one of the benefits of
22:3722 minutes, 37 secondsusing one of these alternatives. But why is multimodel important? If anthropic or open AI has the most frontier model, the
22:4522 minutes, 45 secondsbest model on the planet, why don't I just use that? Well, there's two reasons. Speed and cost. Not everybody
22:5322 minutes, 53 secondshas infinite tokens. And if you have to be mindful about your token spending, using multiple models is actually a really good way to reduce your AI costs.
23:0323 minutes, 3 secondsPlus, if you're not using the top model all the time, you're actually going to be able to complete tasks faster. And let me show you how I do this. So,
23:1123 minutes, 11 secondshere's an example of a multimodel workflow. And you can set this up as a skill, which is really cool. You can
23:1823 minutes, 18 secondsdefine in a skill which model to use at which point and for what use. So for example, let's say I'm building a brand
23:2423 minutes, 24 secondsnew feature. I will do the planning with Fable. I want it to look at my entire codebase. I wanted to come up with a
23:3223 minutes, 32 secondsdetailed plan about how to actually do and build this feature. But once I come up with this overall plan, I don't
23:3923 minutes, 39 secondsnecessarily need a fable level model to execute it to actually write the code.
23:4523 minutes, 45 secondsIn fact, a model like Composer is actually excellent at writing code.
23:5123 minutes, 51 secondsMaybe it's not as good at seeing around corners and knowing every little bit about the codebase and planning this massive feature, but once that's done
23:5923 minutes, 59 secondsand it knows what to write, it is excellent at doing so. And then last, maybe I do the review with GPT 5.5. So after composer wrote everything, rather
24:0824 minutes, 8 secondsthan sending it back to Fable, I'm going to give it to a different model just to get an alternative viewpoint on what was written. So review the code and all of
24:1724 minutes, 17 secondsthis again can be written into a skill very easily. All right. Next, I have to share this because it is an unsolved
Chapter 11: Merging & Deploying Problem
24:2424 minutes, 24 secondsproblem. I have spoken to the OpenAI team. I've spoken to the cursor team.
24:3024 minutes, 30 secondsI've talked to the best agentic engineers on the planet. And this is an unsolved problem. And that is merging
24:3724 minutes, 37 secondsand deploys. And specifically, if you have, like me, potentially a dozen agents running in parallel and you're
24:4424 minutes, 44 secondstrying to get all of that code onto production around the same time, it gets so frustrating and so slow. So, let's
24:5124 minutes, 51 secondssay you have one agent that is looking to merge into main. They do so, then all of a sudden it kicks off the CI. It
24:5924 minutes, 59 secondskicks off the deploy process. Great. You have to wait a couple minutes for that.
25:0325 minutes, 3 secondsThen the second agent right around the same time comes in and it's like okay I want to get my code into main as well.
25:1025 minutes, 10 secondsLet me do that. And then it says, "Oh wait, there's new changes there. I haven't seen those changes. Okay, let me
25:1625 minutes, 16 secondsrebase on my local repo. Let me rerun all of those tests and then let me try
25:2425 minutes, 24 secondsmerging again." And then once it finally does merge, it has to actually run all of those CI and deploy process again and again. And basically, if you can
25:3225 minutes, 32 secondsimagine, you have a third one and a fourth one, and they're all trying to do the same thing on the same codebase, and they start stumbling over each other.
25:4325 minutes, 43 secondsThey start locking the commit process. They start locking the deploy process.
25:4825 minutes, 48 secondsWhat? They're all just waiting. And then every single time one of them gets through, every other one of them has to restart the process completely. It's
25:5825 minutes, 58 secondsbroken. There really isn't a good way to fix this. I've heard of a couple ways, but none of them are perfect. The only real thing to do is to just be patient.
26:0826 minutes, 8 secondsAnd one trick that I sometimes use is set up a bunch of PRs and then do batch commits. Just allow a single agent to
26:1626 minutes, 16 secondslook at all the changes, combine them, and then merge and deploy all at once.
26:2026 minutes, 20 secondsDefinitely far from perfect. And in fact, it's such a known problem that literally today, Curser just announced
26:2826 minutes, 28 secondsthey're building their own Git alternative specifically built for agent scale deployment. So, this is still a
26:3426 minutes, 34 secondsbig problem. It's not really solved and hopefully it will be soon. And again, one of the most important things in this entire video that I want you to go away
26:4226 minutes, 42 secondswith is automations and loops. And if you want to learn more about loops, I made a whole video about it. Check it out right here.