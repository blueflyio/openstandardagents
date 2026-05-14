# Academia and Research Centers

## Cornell University

Cornell's eCornell Agentic AI Architecture certificate is a practical education signal for how universities are packaging agentic AI for engineers, data practitioners, and technical leaders. The program starts with LLM mechanics, prompt engineering, context engineering, and hallucination mitigation, then moves into RAG, Text-to-SQL, GraphRAG, and grounded applications [S07].

The agent-specific course bridges "AI that thinks" to "AI that acts." It covers model/system prompt/tool/memory components, prompt chaining, routing, parallelization, orchestrator-worker patterns, reflection loops, handoffs, multi-agent workflows, and Model Context Protocol for standardized tool interfaces [S07]. The final strategy/governance course moves beyond implementation into opportunity evaluation, algorithmic fairness, values alignment, workforce effects, governance, risk, security, and human oversight [S07].

Relevance to OSSA/DUADP: Cornell's progression mirrors a production maturity path. Teams first learn prompts and RAG, then tool-using agents, then multi-agent protocols and governance. OSSA and DUADP fit the final two layers: explicit contracts for agents and a discovery/trust mechanism for distributed systems [S01][S03][S07].

## Harvard Library Innovation Lab and Berkman Klein Center

Harvard's Agent Protocols Tech Tree (APTT) frames protocols as an "x-ray" of what the agent builder community cares about and what it is being forced to standardize [S08]. The blog explicitly compares today's agent protocol moment with early internet protocol formation around TCP/IP, SMTP, DNS, FTP, HTTP, and SSL: standards emerged through rough consensus and running code because interoperating systems needed a shared language [S08].

APTT argues that agents are easy to reproduce because they are "models using tools in a loop": a model, a control loop, and tools. This simplicity makes central regulation difficult and makes protocol design a powerful lever for shaping which agents are easy to build and how they behave [S08]. The public tech tree maps standards from model building through inference APIs, tool calling, MCP, agent loops, context management, AGENTS.md, llms.txt, skills discovery, A2A, Agent Cards, registries, agent identity, web bot auth, Visa TAP, universal commerce, AP2, signed intent mandates, and audit traces [S09].

Relevance to OSSA/DUADP: APTT's categories align closely with OSSA's contract layer and DUADP's discovery layer. Agent identity, registries, audit traces, signed intent, and skills discovery are exactly the places where a portable manifest and federated registry become useful [S01][S03][S09].

## MIT AI Agent Index

The MIT 2025 AI Agent Index documents 30 prominent AI agents across 45 annotation fields and six categories, based on public information and developer correspondence [S10][S11]. Its central finding is rapid deployment with weak disclosure: 24 of 30 agents launched or received major agentic updates in 2024-2025; only 4 of 13 frontier-autonomy agents disclose any agentic safety evaluations; 25 of 30 disclose no internal safety results; and 23 of 30 have no third-party testing information [S10][S11].

The Index also highlights category-specific autonomy. Chat agents generally stay at Level 1-3 autonomy, browser agents operate at Level 4-5 with limited mid-execution intervention, and enterprise agents often move from Level 1-2 during design to Level 3-5 once event-triggered deployments are active [S10][S11].

The most important governance finding is that web conduct remains unsettled. Browser-based agents may ignore robots.txt, some are designed to bypass anti-bot systems, and only one indexed agent, ChatGPT Agent, used cryptographic request signing according to the Index [S10]. This reinforces the need for agent identity, signed requests, verifiable delegation, and "Know Your Agent" style standards [S44].

## MIT Sloan and enterprise readiness

MIT Sloan's 2026 decision-maker guidance is more cautious than vendor marketing. Davenport and Bean say agentic AI "isn't ready for prime time - yet" because hallucinations, mistakes, and prompt-injection vulnerabilities slow adoption and require human-in-the-loop guardrails [S45]. They still expect AI agents to handle most transactions in many large-scale business processes within five years, so organizations should build internal capability and reusable workflows now [S45].

The practical takeaway is not to avoid agents. It is to choose bounded workflows, define approval points, build agent factories and evaluation processes, and separate productivity demos from production autonomy [S36][S45].

## Harvard policy and law scholarship

The Harvard Journal of Law and Technology's "Institutional Origins of the Agentic Web" uses the Amazon-Perplexity Comet dispute to frame a core governance question: will agent authority be defined by proprietary platform rules or by open protocols for portable identity, verifiable delegation, and accountable behavior [S44]? The article argues that transparent identification is non-negotiable but should not necessarily be controlled solely by platform-specific mechanisms [S44].

The same article describes a possible lifecycle governance stack: identity anchored in decentralized identifiers and verifiable credentials; delegation/standing through verifiable intent mandates; and runtime control through monitoring, enforcement constraints, and adaptive oversight [S44]. It also argues for Know Your Agent standards that identify who an agent is, on whose behalf it acts, what scope it has, and how its actions can be audited [S44].

Harvard Kennedy School Student Policy Review adds the infrastructure angle. It notes that bots already comprise about 50% of internet traffic, and more autonomous bot-to-bot activity could grow super-exponentially, crowding out human traffic unless bot communication becomes more efficient and better distinguished from human activity [S46]. The article recommends protocols for bot-bot coordination and stronger human verification such as next-generation proof-of-personhood, secure hardware, or decentralized reputation [S46].

## arXiv and ACM research

The arXiv survey of MCP, ACP, A2A, and ANP provides a useful comparative frame. It classifies MCP as JSON-RPC agent-to-tool access, ACP as RESTful structured messaging with synchronous/asynchronous interactions, A2A as peer-to-peer task delegation using Agent Cards, and ANP as decentralized discovery and secure collaboration using W3C DIDs and JSON-LD graphs [S41].

The survey's proposed adoption path starts with MCP for tool access, adds ACP for structured multimodal messaging and discovery, adds A2A for collaborative task execution, and extends to ANP for decentralized marketplaces [S41]. This is consistent with a layered architecture rather than a single winning protocol [S41].

ACM Computing Surveys' "AI Agents Under Threat" identifies four knowledge gaps that drive agent security risk: unpredictable multi-step inputs, complex internal execution, variable operating environments, and interactions with untrusted external entities [S42]. It argues that agent security needs to account for perception, "brain" reasoning/planning, action/tool execution, environment interaction, agent-to-agent interaction, and memory [S42].

Another arXiv security survey, "From Prompt Injections to Protocol Exploits," extends this into an end-to-end threat model for LLM-agent ecosystems. It catalogs more than 30 attacks across input manipulation, model compromise, system/privacy attacks, and protocol vulnerabilities, including MCP, ACP, ANP, and A2A [S43].

## Key academic themes

1. Protocols are governance infrastructure, not only developer convenience [S08][S44].
2. Agent identity and delegation are becoming first-class research and policy topics [S12][S44].
3. Public transparency lags capability disclosure, especially for safety evaluations [S10][S11].
4. Web conduct standards for autonomous agents are unsettled [S10][S44][S46].
5. Agent education is converging on LLMs, RAG, tool loops, multi-agent workflows, MCP, governance, and human oversight [S07].
