---
layout: post
title: "Microsoft Agent Framework: Agent-as-Tools vs Handoff"
date: 2026-04-11 10:00:00 -0300
categories: ai agents
description: When to use agent-as-tools orchestration versus handoff — a practical breakdown using a real reading assistant built with .NET MVC 9 and pgvector.
tags: ai agents microsoft orchestration llm dotnet
author: Fábio R. Nóbrega
continue: Continue reading
comments: false
read_time: Reading time
image: 2026-04-11-maf-handoff-agent-as-tools.png
---

The [Microsoft Agent Framework](https://learn.microsoft.com/en-us/agent-framework/workflows/orchestrations/) gives you five ways to wire agents together. Sequential runs agents one after another in a fixed pipeline. Concurrent runs them in parallel. Group Chat lets agents collaborate in a shared conversation. Magentic drops a manager agent in charge of dynamically coordinating the others. All four are worth their own posts.
The two that trip people up are agent-as-tools and handoff. They both have a routing agent. They both have specialists. At first glance they look like the same thing with different names.
The difference is in who stays in control after the routing decision. And if you pick the wrong one, you'll feel it.

## The project

I'm building a reading assistant on top of my Kindle highlights. I read a lot — Philip K. Dick, Asimov, Murakami, Camus, Julian Assange, Musashi — and my highlights jump across science fiction, philosophy, economics, and martial arts. The agent needs to answer questions about all of that.

It has two modes:

- **Scope 1 — RAG:** search my highlights using pgvector similarity on `book_note.embedding`, enriched with `book.Context` (an LLM-generated thematic background I store per book in the database)
- **Scope 2 — Full context:** load my entire reading library from `user_reading_synthesis` — a pre-built table with all highlights concatenated — and let the model reason across everything at once

Some questions are clearly Scope 1:

- *"What do my Philip K. Dick notes have in common?"*
- *"Compare my Japanese author highlights with PKD"*

Some are clearly Scope 2:

- *"What is my core search in life based on my notes?"*
- *"What is my primary reading genre?"*

And some are both at the same time — *"What is my favourite theme in PKD, and does it connect to my general reading identity?"* That last one is where the orchestration choice actually matters.



## The core difference

```mermaid
flowchart TD
    subgraph AT ["Agent-as-Tools — orchestrator stays in control"]
        direction TB
        O1["Orchestrator\nreads question, decides scope"]
        S1["Scope 1\nRAG tool"]
        S2["Scope 2\nfull context tool"]
        O2["Orchestrator\nmerges + formats answer"]
        O1 -->|specific books?| S1
        O1 -->|identity/general?| S2
        S1 --> O2
        S2 --> O2
    end

    subgraph HO ["Handoff — control transfers to specialist"]
        direction TB
        T["Triage agent\nroutes then steps aside"]
        SC1["Scope 1\nowns the conversation"]
        SC2["Scope 2\nowns the conversation"]
        T -->|specific books?| SC1
        T -->|identity/general?| SC2
        SC1 -->|answers directly| U1(["User"])
        SC2 -->|answers directly| U2(["User"])
    end
```

With **agent-as-tools**, the orchestrator calls each scope as a function tool, gets the results back, and writes the final answer. It never gives up control.

With **handoff**, the triage agent routes to a specialist — and then it's done. The specialist owns the conversation from that point and answers directly to the user. The triage agent is gone.



## How the routing actually works in agent-as-tools

There's no IF/ELSE block anywhere. The orchestrator has two tools registered with descriptions, and the LLM reads those descriptions to decide which one fits the question. That's the whole classifier.

```mermaid
flowchart TD
    Q(["User question"])
    ORC["Orchestrator agent\nreads question + tool descriptions\ndecides which tool fits"]
    T1["SearchBookHighlights(query, authors[])\nscope 1 — RAG + pgvector"]
    T2["AnalyseFullLibrary(query)\nscope 2 — full corpus"]
    PG["pgvector similarity search\nbook_note.embedding\nfiltered by author"]
    SYN["Load user_reading_synthesis\nfull_context → LLM"]
    ANS["Orchestrator\nenriches with book.Context\nformats final answer"]
    R(["Answer to user"])

    Q --> ORC
    ORC -->|"mentions PKD, Camus, specific author"| T1
    ORC -->|"identity, patterns, life themes"| T2
    T1 --> PG --> ANS
    T2 --> SYN --> ANS
    ANS --> R
```

The system prompt just says *"always call exactly one tool, never answer directly"*. Author names get extracted automatically from the question and passed as parameters to the RAG tool, which uses them as SQL filters on the pgvector search. No parsing, no regex.

And when a question needs both scopes, the orchestrator calls both tools and merges the result. The user sees one answer.



## How handoff flows

```mermaid
flowchart TD
    Q(["User question"])
    TR["Triage agent\nroutes based on question type"]
    SP1["Scope 1 specialist\nowns conversation"]
    SP2["Scope 2 specialist\nowns conversation"]
    HU1{"needs more\nfrom user?"}
    HU2{"needs more\nfrom user?"}
    RI1["waits for user input\nor runs autonomously"]
    RI2["waits for user input\nor runs autonomously"]
    A1(["Answer to user"])
    A2(["Answer to user"])

    Q --> TR
    TR -->|handoff| SP1
    TR -->|handoff| SP2
    SP1 --> HU1
    SP2 --> HU2
    HU1 -->|yes| RI1 --> SP1
    HU1 -->|no| A1
    HU2 -->|yes| RI2 --> SP2
    HU2 -->|no| A2
```

After the handoff the triage agent is completely out. The specialist can ask the user follow-up questions, keep the conversation going across multiple turns, and build on what was said before. That loop is the whole point of handoff. It's also why it's the wrong pattern here.



## Why agent-as-tools wins for this

**The orchestrator needs to do something after retrieval.**
When Scope 1 comes back with the top highlights, I still need to inject `book.Context` as thematic background before writing the final answer. With handoff the specialist already answered — the orchestrator is gone and can't touch it.

**Some questions need both scopes.**
That PKD + reading identity question from earlier? Agent-as-tools calls both tools and merges. Handoff forces you to pick one.

**The scope agents have nothing to ask the user.**
Handoff is interactive by design. When a handoff agent doesn't route further, it [blocks and waits for user input](https://learn.microsoft.com/en-us/agent-framework/workflows/orchestrations/handoff). My scope agents just retrieve and return — there's no back-and-forth. I'd have to add `with_autonomous_mode()` as a workaround, which adds complexity for no reason.



## The one case where handoff wins

If I ever add a **deep-dive mode** — user says *"let's spend this session going deep on PKD only"* — then handoff makes sense. The Scope 1 agent takes full control, asks clarifying questions, builds on previous answers across multiple turns.

```mermaid
flowchart TD
    Q(["User: let's go deep on PKD"])
    TR["Triage agent\ndetects deep-dive intent"]
    SP["Scope 1 specialist\ntakes full ownership"]
    F1["Which aspect interests you most?"]
    F2["How does this connect to your Musashi highlights?"]
    F3["Want me to pull the Camus highlights for comparison?"]
    A(["Rich multi-turn session"])

    Q --> TR -->|handoff| SP
    SP --> F1 --> SP
    SP --> F2 --> SP
    SP --> F3 --> A
```

That's what handoff is built for. I could add it later as an optional mode without touching the core architecture.



## Quick decision guide

```mermaid
flowchart TD
    START(["What kind of question?"])
    Q1{"mentions specific\nbooks or authors?"}
    Q2{"needs both scopes\nin one answer?"}
    Q3{"user wants multi-turn\nspecialist session?"}
    S1["Agent-as-Tools\nScope 1 RAG tool"]
    S2["Agent-as-Tools\nScope 2 full context tool"]
    S12["Agent-as-Tools\ncall both tools, merge"]
    HO["Handoff\ndeep-dive mode"]

    START --> Q1
    Q1 -->|yes| Q2
    Q1 -->|no| S2
    Q2 -->|yes| S12
    Q2 -->|no| Q3
    Q3 -->|yes| HO
    Q3 -->|no| S1
```
## Project Code 

Take a look on the original code and the final decision on the github page [BookNotesAI](https://github.com/FabioRNobrega/book-notes-ia).


## References

- [Workflow orchestrations — Microsoft Agent Framework](https://learn.microsoft.com/en-us/agent-framework/workflows/orchestrations/)
- [Handoff orchestration (C#)](https://learn.microsoft.com/en-us/agent-framework/workflows/orchestrations/handoff?pivots=programming-language-csharp)
- [Sequential orchestration (C#)](https://learn.microsoft.com/en-us/agent-framework/workflows/orchestrations/sequential?pivots=programming-language-csharp)
- [RAG with Microsoft Agent Framework](https://learn.microsoft.com/pt-pt/agent-framework/agents/rag?pivots=programming-language-csharp)
- [pgvector — vector similarity for Postgres](https://github.com/pgvector/pgvector)
- [Microsoft.Extensions.AI — AIFunctionFactory](https://learn.microsoft.com/en-us/dotnet/api/microsoft.extensions.ai.aifunctionfactory)