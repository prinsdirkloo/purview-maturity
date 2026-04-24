import { useState, useRef, useMemo } from "react";
const React = { useRef };

const BUI_ORANGE = "#D9861C";
const BUI_GRAY   = "#535657";
const CAL        = "Calibri, 'Gill Sans MT', 'Gill Sans', Candara, sans-serif";

// ── THEME — colours verified against BUI Brandline ───────────────────────────
// Approved palette: #D9861C (primary-orange), #535657 (primary-grey),
// #000000 (neutral-black), #FFFFFF (neutral-white). Font: Calibri.
function makeTheme(dark) {
  return dark ? {
    // Dark mode: #000000 base per Brandline neutral-black
    bg:"#000000", bgHeader:"#0a0a0a", bgSidebar:"#0a0a0a",
    bgCard:"rgba(255,255,255,0.04)", bgStripe:"rgba(255,255,255,0.02)",
    border:"rgba(255,255,255,0.1)", borderSub:"rgba(255,255,255,0.05)",
    text1:"#ffffff", text2:"#d1d5db", text3:"#9ca3af", text4:"#6b7280",
    text5:"#4b5563", textMuted:"#374151",
    sidebarItem:"rgba(255,255,255,0.04)", sidebarBorder:"rgba(255,255,255,0.1)",
    pipEmpty:"rgba(255,255,255,0.15)", cmItem:"rgba(255,255,255,0.04)",
    cmItemBorder:"rgba(255,255,255,0.08)", noteText:"#6b7280", shadow:"none",
  } : {
    // Light mode: #FFFFFF base per Brandline neutral-white
    bg:"#FFFFFF", bgHeader:"#FFFFFF", bgSidebar:"#FFFFFF",
    bgCard:"#FFFFFF", bgStripe:"rgba(0,0,0,0.02)",
    border:"rgba(0,0,0,0.1)", borderSub:"rgba(0,0,0,0.05)",
    text1:"#000000", text2:"#1f2937", text3:"#4b5563", text4:"#6b7280",
    text5:"#9ca3af", textMuted:"#d1d5db",
    sidebarItem:"rgba(0,0,0,0.03)", sidebarBorder:"rgba(0,0,0,0.1)",
    pipEmpty:"rgba(0,0,0,0.12)", cmItem:"rgba(0,0,0,0.03)",
    cmItemBorder:"rgba(0,0,0,0.08)", noteText:"#6b7280",
    shadow:"0 1px 4px rgba(0,0,0,0.06)",
  };
}

// ── IMPACT LEVELS ─────────────────────────────────────────────────────────────
const impactLevels = {
  none:     { score:0, level:"No Impact",       color:"#10b981", colorBg:(d)=>d?"rgba(16,185,129,0.08)":"rgba(16,185,129,0.07)",   colorBorder:(d)=>d?"rgba(16,185,129,0.2)":"rgba(16,185,129,0.25)",   summary:"Users are completely unaffected. No visible change to any workflow or application experience.", personas:[], cmActions:["Brief your security team on what will be captured","Align stakeholders on policy scope and data classifications","Document baseline findings for future reference"], cmUrgency:"low" },
  minimal:  { score:1, level:"Minimal",         color:"#06b6d4", colorBg:(d)=>d?"rgba(6,182,212,0.08)":"rgba(6,182,212,0.07)",     colorBorder:(d)=>d?"rgba(6,182,212,0.2)":"rgba(6,182,212,0.25)",     summary:"No visible change for end users. Security and compliance teams begin receiving data.", personas:["Security / SOC team","Compliance officers","DLP administrators"], cmActions:["Onboard SOC analysts to the alert queue and triage workflow","Define incident severity classifications and escalation paths","Begin building a false positive exception register","Share high-level risk findings with stakeholders — no user comms needed yet"], cmUrgency:"low" },
  low:      { score:2, level:"Low",             color:"#3b82f6", colorBg:(d)=>d?"rgba(59,130,246,0.08)":"rgba(59,130,246,0.06)",   colorBorder:(d)=>d?"rgba(59,130,246,0.2)":"rgba(59,130,246,0.25)",   summary:"Analysts actively reviewing. No end user experience changes but internal processes are now live.", personas:["Security / SOC team","DLP administrators","IT helpdesk (awareness only)"], cmActions:["Run analyst training on triage and investigation tools","Establish regular DLP review cadence with security team","Prepare helpdesk with awareness that enforcement is being planned","Produce first stakeholder risk report to socialise the programme"], cmUrgency:"low" },
  moderate: { score:3, level:"Moderate",        color:"#a78bfa", colorBg:(d)=>d?"rgba(167,139,250,0.08)":"rgba(167,139,250,0.07)", colorBorder:(d)=>d?"rgba(167,139,250,0.2)":"rgba(167,139,250,0.25)", summary:"End users see notifications for the first time. The most significant change management milestone in the programme.", personas:["All end users (M365)","Line managers","IT helpdesk","Business unit leads"], cmActions:["Send organisation-wide awareness communication BEFORE go-live","Publish a clear FAQ covering what triggers notifications and what users should do","Brief line managers so they can field questions from their teams","Train helpdesk on common scenarios","Identify champions in each business unit","Prepare a feedback channel for users"], cmUrgency:"high" },
  elevated: { score:4, level:"Elevated",        color:BUI_ORANGE, colorBg:(d)=>d?"rgba(217,134,28,0.08)":"rgba(217,134,28,0.07)",  colorBorder:(d)=>d?"rgba(217,134,28,0.2)":"rgba(217,134,28,0.25)",  summary:"Users must actively justify actions or classify content before proceeding. Change management must be proactive and ongoing.", personas:["All end users (M365)","Line managers","Business unit leads","IT helpdesk","HR (governance)"], cmActions:["Communicate the change to all users BEFORE activation","Publish clear guidance on acceptable justifications or label choices","Establish a fast-track exception request process","Provide line managers with override/classification reporting","Run targeted training for high-risk roles (finance, HR, legal, executives)","Monitor data quality weekly — use it to improve training","Set up a regular feedback loop between security and business teams"], cmUrgency:"high" },
  high:     { score:5, level:"High",            color:"#ef4444", colorBg:(d)=>d?"rgba(239,68,68,0.08)":"rgba(239,68,68,0.06)",     colorBorder:(d)=>d?"rgba(239,68,68,0.2)":"rgba(239,68,68,0.25)",     summary:"Actions blocked or content encrypted with no simple override. Any misconfiguration directly disrupts legitimate work. Executive sponsorship is non-negotiable.", personas:["Targeted end users (by role/label)","Line managers","IT helpdesk","Executive sponsors","Legal / compliance"], cmActions:["Obtain explicit executive sponsorship before activation","Communicate the change to affected users with at least 2 weeks notice","Establish and publicise a formal exception approval process","Train helpdesk to handle escalations — agree SLA for responses","Conduct a final validation exercise immediately before go-live","Define a rapid rollback process if workflows are disrupted","Schedule a post-go-live review at 2 weeks"], cmUrgency:"critical" },
};

// ── DLP PHASES ────────────────────────────────────────────────────────────────
const dlpPhases = [
  { num:"01", zone:"DISCOVER", zoneColor:"#10b981", color:"#10b981", colorBg:(d)=>d?"rgba(16,185,129,0.07)":"rgba(16,185,129,0.06)", colorBorder:(d)=>d?"rgba(16,185,129,0.2)":"rgba(16,185,129,0.25)", title:"Simulation Mode", subtitle:"Full policy configured — zero production impact", icon:"🔬", impact:"none",
    desc:"Create complete DLP policies with all conditions, exceptions, and actions — but run them in simulation mode only. No user-facing actions occur. Validate policy logic, tune match accuracy, and understand your data exposure landscape before committing anything live.",
    config:[["Policy Mode","Simulation","neutral"],["Actions","None (simulated only)","off"],["Policy Tips","Off","off"],["User Notifications","Off","off"],["Incident Reports","Admin review only","active"]],
    outcomes:["Baseline data inventory","False positive identification","Scope validation","Zero user impact"],
    license:{ base:'M365 E3', addOn:null, addOnFeatures:[], note:'Core DLP simulation is included in M365 E3 across Exchange, SharePoint, and OneDrive.' },
    zoneDesc:"Build a comprehensive evidence base about your data landscape and policy behaviour before exposing any user-facing controls.", nextPhase:{ time:'2–4 weeks minimum', success:'False positive rate is understood and documented; matched items reviewed; conditions tuned; no unexpected high-volume matches remain unexplained', people:'DLP admin reviews report; security team aligned on scope; relevant business stakeholders briefed on what was found', process:'Produce a simulation findings report; document any policies that need condition changes before going live; get sign-off from security lead', technology:'Review DLP match activity in Purview portal; tune confidence thresholds and instance counts; validate all intended workloads are in scope', licensing:'No change — M365 E3 covers this phase', skip:false },
    tip:"Run simulation for a minimum of 2–4 weeks. Use Purview DLP reports to review matched items, refine conditions (confidence thresholds, instance counts), and document expected vs unexpected matches before progressing." },
  { num:"02", zone:"DISCOVER", zoneColor:"#059669", color:"#059669",
    colorBg:(d)=>d?"rgba(5,150,105,0.10)":"rgba(5,150,105,0.08)",
    colorBorder:(d)=>d?"rgba(5,150,105,0.30)":"rgba(5,150,105,0.35)",
    title:"Enforcement Pilot", subtitle:"Scoped hard block for a consenting group — time-boxed; transitions to Security Team Alerts (phase 03) on completion", icon:"🧪", impact:"moderate",
    isPilot:true,
    desc:"After Simulation Mode (phase 01) has provided enough data to tune and validate policy conditions, a time-boxed Enforcement Pilot activates hard block rules for a small, named, consenting group — typically 10–25 users from a single department. The purpose is to prove that policies work correctly under real enforcement conditions, that analysts can handle the alert and incident volume, and that the helpdesk escalation path functions end-to-end. On completion the policy transitions to Security Team Alerts (phase 03) for all users — actions are removed, scope expands to everyone, and the permanent maturity progression begins. This Enforcement Pilot is specific to DLP. The Sensitivity Labelling track does not require an equivalent — its 'Labels Published — Pilot' (labelling phase 02) serves a different purpose: introducing the label taxonomy for familiarity rather than validating blocking behaviour.",
    config:[["Policy Mode","Active — pilot scope only","warn"],["Actions","Hard block — pilot group","warn"],["Policy Tips","On — pilot group only","active"],["User Notifications","On — pilot group only","active"],["All Other Users","Security Team Alerts (audit mode)","active"],["Next Phase","Transitions to phase 03 (Security Team Alerts)","active"],["Pilot Duration","2–4 weeks (time-boxed)","neutral"],["Pilot Scope","Named consenting group (10–25 users)","neutral"]],
    outcomes:["Production policy validation","Analyst & helpdesk readiness confirmed","Blocking behaviour verified","Exit criteria assessed","Progresses to phase 03 (Security Team Alerts) on completion"],
    license:{ base:'M365 E3', addOn:null, addOnFeatures:[], note:'The Enforcement Pilot uses core DLP blocking (E3). If the pilot scope includes Teams chat messages, the Purview Suite add-on is required for that workload.' },
    zoneDesc:"The Discover zone builds all the evidence needed before any user-facing enforcement. The pilot sits here because it is still a validation exercise — not yet permanent enforcement. Completion of the pilot is the bridge into the permanent maturity progression — phase 03 (Security Team Alerts) follows directly.",
    nextPhase:{ time:'2–4 weeks (time-boxed)', success:'Exit criteria met: false positive rate within threshold, analyst response time within SLA, no legitimate workflows broken; all pilot group issues documented and resolved; findings report produced', people:'Pilot group includes business stakeholders (not just IT); security lead and at least one business unit manager have reviewed findings; helpdesk has handled real escalations', process:'Findings report shared with stakeholders; any false positives addressed before progressing; formal sign-off obtained from security lead and executive sponsor', technology:'Confirm policy conditions are correct across all intended workloads; verify alert routing and incident workflow function end-to-end', licensing:'M365 E3 for Exchange/SharePoint/OneDrive pilot scope. Purview Suite add-on required if Teams chat is included', skip:false },
    tip:"Define exit criteria before the pilot starts — not after. Typical criteria: fewer than X false positives per day, analyst response time under Y minutes, no legitimate business workflows broken. If exit criteria are not met, extend the pilot window and re-tune. On successful completion, move forward to phase 03 (Security Team Alerts) and begin the formal Educate zone progression.",
    pilotWarning:"IT-only pilots validate the technology — but a truly successful pilot must include real business stakeholders. Finance teams who handle payment data, HR staff who process employee records, legal who share sensitive contracts — these are the people whose workflows will actually be affected by enforcement. An IT-only pilot will tell you the policy fires correctly. A cross-functional pilot will tell you whether the policy fires on the right things, whether the justification process makes sense to real users, and whether your helpdesk can handle the volume. Recruit at least 3–4 business units into the pilot group and ensure each has a nominated point of contact who reports back on the experience." },
  { num:"03", zone:"DISCOVER", zoneColor:"#10b981", color:"#10b981", colorBg:(d)=>d?"rgba(16,185,129,0.07)":"rgba(16,185,129,0.06)", colorBorder:(d)=>d?"rgba(16,185,129,0.2)":"rgba(16,185,129,0.25)", title:"Security Team Alerts", subtitle:"SOC/DLP team notified — users remain unaware", icon:"🔔", impact:"low",
    desc:"Following a successful Enforcement Pilot (phase 02), the programme moves forward to this phase — actions removed, scope expanded to all users. Analysts receive real-time alerts when policy conditions are triggered, but users see nothing. This is the confirmed starting point for the permanent maturity progression: the pilot has validated that blocking works, now the organisation builds the analyst readiness and change management foundation before enforcement is introduced more broadly.",
    config:[["Policy Mode","Active","active"],["Actions","None","off"],["Admin Notifications","On — DLP/SOC team","active"],["Policy Tips","Off","off"],["User Notifications","Off","off"]],
    outcomes:["SOC triage readiness","Analyst playbook validation","Escalation path testing","Zero user impact"],
    license:{ base:'M365 E3', addOn:'Purview Suite add-on', addOnFeatures:['DLP for Teams chat messages', 'Advanced policy tips (advanced classifiers, oversharing dialog)', 'Advanced Sensitive Information Types (trainable classifiers)'], note:'Core policy tips on Exchange, SharePoint, and OneDrive are included in M365 E3. The Purview Suite add-on is required if scope includes Teams chat, advanced classifiers, or the oversharing dialog.' },
    zoneDesc:"Build a comprehensive evidence base about your data landscape and policy behaviour before exposing any user-facing controls.", nextPhase:{ time:'2–4 weeks', success:'Alert volume is manageable; analysts can triage within agreed SLA; no high false-positive rate; helpdesk briefed and ready; user communications drafted for Policy Tips', people:'SOC/DLP analyst team comfortable with alert queue; helpdesk manager briefed; HR and Communications have reviewed user-facing messaging', process:'Document triage workflow and escalation path; establish a false positive register; define override justification expectations for the next phase', technology:'Verify alert routing is working correctly; confirm DLP reports are accessible to the right people; check Teams chat scoping if applicable', licensing:'No change for core workloads — M365 E3. If Teams chat alerts are in scope, Purview Suite add-on required', skip:false },
    tip:"After the pilot completes and this phase begins, give analysts 2–4 weeks before progressing. Use the time to review the full alert volume across all users, tune any conditions that generated noise during the pilot, and begin drafting user communications for Policy Tips." },
  { num:"04", zone:"EDUCATE", zoneColor:BUI_ORANGE, color:BUI_ORANGE, colorBg:(d)=>d?"rgba(217,134,28,0.07)":"rgba(217,134,28,0.06)", colorBorder:(d)=>d?"rgba(217,134,28,0.2)":"rgba(217,134,28,0.25)", title:"Policy Tips", subtitle:"Contextual guidance at the moment of risk", icon:"💡", impact:"moderate",
    desc:"Activate policy tips so users receive an in-app notification when they're about to trigger a policy — attaching a file in Teams, uploading to SharePoint, drafting a sensitive email. The action is not blocked. This is the first visible signal to end users and the most important change management milestone.",
    config:[["Policy Mode","Active","active"],["Actions","None","off"],["Admin Notifications","On","active"],["Policy Tips","On — informational","active"],["User Override","Optional (with or without justification)","neutral"]],
    outcomes:["User awareness","Behaviour change signal","Override data collection","Low friction"],
    license:{ base:'M365 E3', addOn:'Purview Suite add-on', addOnFeatures:['DLP for Teams chat messages', 'Endpoint DLP (devices, USB, print blocking)', 'Advanced classifiers in soft block conditions'], note:'Soft block on Exchange, SharePoint, and OneDrive is included in M365 E3. The Purview Suite add-on is required for Teams chat soft blocks, Endpoint DLP, and conditions using trainable classifiers.' },
    zoneDesc:"Drive behavioural change through awareness and accountability. Friction should be proportional and explainable.", nextPhase:{ time:'4–8 weeks', success:'Policy tip volume is understood; override justification data is being collected and reviewed; no major user confusion; helpdesk query volume has stabilised; false positive rate is below agreed threshold', people:'Business unit champions have been identified; line managers briefed; HR and Communications sign-off on soft block messaging', process:'Analyse override justifications from this phase — high override rates signal a policy tuning need before soft blocking; prepare a soft block communication plan; test the justification UX with a sample group', technology:'Review policy tip match data in DLP reports; tune any conditions generating excessive tips; ensure justification capture is configured', licensing:'No change if limited to Exchange/SharePoint/OneDrive (M365 E3). Purview Suite add-on required for Teams chat tips and advanced classifiers', skip:false },
    tip:"Require business justifications on overrides even at this non-blocking stage. The justification data reveals whether conditions are correct, which users need training, and which violations are legitimate needs." },
  { num:"05", zone:"EDUCATE", zoneColor:BUI_ORANGE, color:BUI_ORANGE, colorBg:(d)=>d?"rgba(217,134,28,0.07)":"rgba(217,134,28,0.06)", colorBorder:(d)=>d?"rgba(217,134,28,0.2)":"rgba(217,134,28,0.25)", title:"Soft Block", subtitle:"Action paused — user can proceed with justification", icon:"⚠️", impact:"elevated",
    desc:"The risky action is interrupted and the user must provide a written business justification before proceeding. The action is not permanently denied — the user retains control — but every override is logged with their rationale. This delivers maximum behavioural change while still respecting user autonomy.",
    config:[["Policy Mode","Active","active"],["Actions","Restrict / soft block","warn"],["Admin Notifications","On","active"],["Policy Tips","On","active"],["User Override","Allowed with mandatory justification","warn"]],
    outcomes:["Accountability culture","Friction-driven awareness","Documented override audit trail","Moderate enforcement"],
    license:{ base:'M365 E3', addOn:'Purview Suite add-on', addOnFeatures:['DLP for Teams chat messages', 'Endpoint DLP (devices, USB, print blocking)', 'Label-conditioned DLP hard blocks (requires Purview Suite for labelling track)'], note:'Hard block on Exchange, SharePoint, and OneDrive is included in M365 E3. The Purview Suite add-on is required for Teams chat, Endpoint DLP, and label-conditioned policies (which rely on the labelling track that requires the add-on for encryption).' },
    zoneDesc:"Drive behavioural change through awareness and accountability. Friction should be proportional and explainable.", nextPhase:{ time:'4–12 weeks — do not rush', success:'Override justification quality is high; false positive rate is at or below threshold; no legitimate business workflows are being blocked; exception process is functioning; exec sponsor confirmed; analysts ready for hard block incident volume', people:'Executive sponsor confirmed and briefed; legal and compliance team aligned on hard block scope; helpdesk trained on hard block escalation with agreed SLA', process:'Define the exact scope of hard block policies (which labels/SITs, which workloads) — do not apply broadly; establish formal exception approval workflow; define rollback process', technology:'Validate label-conditioned DLP is available if needed; confirm Endpoint DLP is licensed and configured if devices are in scope; run a final false positive check on all conditions', licensing:'Hard block on Exchange/SharePoint/OneDrive is M365 E3. Teams chat hard block, Endpoint DLP, and label-conditioned policies require Purview Suite add-on', skip:false },
    tip:"Analyse override justifications regularly. High override rates on specific rules often indicate a legitimate business exception — tune the policy rather than forcing repeated overrides." },
  { num:"06", zone:"ENFORCE", zoneColor:"#ef4444", color:"#ef4444", colorBg:(d)=>d?"rgba(239,68,68,0.07)":"rgba(239,68,68,0.06)", colorBorder:(d)=>d?"rgba(239,68,68,0.2)":"rgba(239,68,68,0.25)", title:"Hard Block", subtitle:"Action denied — no override possible", icon:"🚫", impact:"high",
    desc:"The highest enforcement level. The action is blocked entirely and the user cannot override. Reserved for the most sensitive data classifications — highly confidential, regulated PII, financial data under compliance mandates — or repeat violators. Only apply to conditions with very high confidence and low false positive rates.",
    config:[["Policy Mode","Active","active"],["Actions","Block — no override","danger"],["Admin Notifications","On","active"],["Policy Tips","On — explains why blocked","active"],["User Override","Not allowed","danger"]],
    outcomes:["Regulatory compliance posture","Zero data exfiltration path","Maximum enforcement","Helpdesk escalation required"],
    license:{ base:'M365 E3', addOn:'Purview Suite add-on', addOnFeatures:['Content Explorer and Activity Explorer (data classification analytics)', 'Advanced audit log retention (180+ days requires Audit Premium)'], note:'Policy governance and basic audit are included in M365 E3. The Purview Suite add-on unlocks Content Explorer, Activity Explorer, and Audit (Premium) for extended log retention and high-value event coverage.' },
    zoneDesc:"Apply hard controls only to the highest-risk classifications where consequences outweigh disruption. This zone is earned, not assumed.", nextPhase:{ time:'Ongoing — no fixed duration', success:'False positive rate remains below threshold; exception volumes are manageable; no shadow IT behaviour emerging; DLP programme is aligned with sensitivity labelling track', people:'Named policy owners in security and each business unit; regular DLP steering group meeting; label taxonomy owner aligned', process:'Quarterly policy review cadence; exception lifecycle management; stale policy retirement process; feedback loop between DLP incidents and label taxonomy', technology:'Content Explorer and Activity Explorer for analytics (requires Purview Suite); auto-labelling alignment when labelling track matures; consider Insider Risk Management integration', licensing:'Governance tooling (Content Explorer, Activity Explorer, Audit Premium) requires Purview Suite add-on if not already licensed', skip:false },
    tip:"Always provide a clear escalation path for legitimate exceptions. Hard blocks with no exception path erode trust and generate shadow IT. Scope by sensitivity label, not broad content conditions." },
  { num:"07", zone:"GOVERN", zoneColor:BUI_GRAY, color:BUI_GRAY, colorBg:(d)=>d?"rgba(83,86,87,0.07)":"rgba(83,86,87,0.06)", colorBorder:(d)=>d?"rgba(83,86,87,0.2)":"rgba(83,86,87,0.25)", title:"Continuous Improvement", subtitle:"Tuning, exception management & policy lifecycle", icon:"♻️", impact:"minimal",
    desc:"DLP is not a set-and-forget control. Establish a regular review cadence: revisit false positive rates, retire outdated policies, promote simulation-mode policies for new data types, and align scope with evolving sensitivity labels and your information architecture.",
    config:[["Review Cadence","Monthly / quarterly","neutral"],["False Positive Target","Define and track a threshold","neutral"],["Exception Management","Formal approval workflow","active"],["Label Alignment","Sensitivity labels ↔ policy rules","active"],["Policy Ownership","Named business + security owners","active"]],
    outcomes:["Policy health reviews","Exception lifecycle management","Label-to-policy alignment","Adaptive risk posture"],
    license:{ base:'M365 E3', addOn:null, addOnFeatures:[], note:'Continuous improvement governance does not require additional licensing beyond what is already in place for the active enforcement phases.' },
    zoneDesc:"Sustain the programme through structured ownership, regular review cycles, and a feedback loop between incidents and policy design.", nextPhase:{ skip:true },
    tip:"Feed override justifications and incident data back into your sensitivity labelling taxonomy. High-frequency violations often signal a labelling gap — not just an enforcement gap." },
];

// ── SENSITIVITY LABELLING PHASES ──────────────────────────────────────────────
const labelPhases = [
  { num:"01", zone:"DISCOVER", zoneColor:"#10b981", color:"#10b981", colorBg:(d)=>d?"rgba(16,185,129,0.07)":"rgba(16,185,129,0.06)", colorBorder:(d)=>d?"rgba(16,185,129,0.2)":"rgba(16,185,129,0.25)", title:"Discovery & Taxonomy Design", subtitle:"MIP Scanner, data mapping, label structure — no labels published", icon:"🗺️", impact:"none",
    desc:"Before publishing a single label, run MIP Scanner (or Purview data discovery) across your on-premises and cloud repositories to understand what sensitive data you actually have. Use this to design your label taxonomy — typically 3–5 labels (Public → General → Confidential → Highly Confidential, optionally with sub-labels). Don't publish anything yet.",
    config:[["Labels Published","No","off"],["MIP Scanner","Active — discovery mode","active"],["User Visibility","None","off"],["Purview Analytics","On — data mapping","active"],["Taxonomy Design","In progress","neutral"]],
    outcomes:["Sensitive data inventory","Taxonomy design validated","Stakeholder alignment on labels","Zero user impact"],
    license:{ base:'M365 E3', addOn:null, addOnFeatures:[], note:'MIP Scanner for on-premises discovery is included with M365 E3 (requires AIP Unified Labelling client). Cloud data discovery through Purview uses E3 licensing.' },
    zoneDesc:"Build a data map before designing labels. The taxonomy you choose here is load-bearing — changing it retroactively after millions of files are labelled is painful.", nextPhase:{ time:'4–8 weeks', success:'Label taxonomy documented and agreed; MIP Scanner completed across all in-scope repositories; sensitive data inventory available; taxonomy validated with at least 3–4 non-IT business representatives', people:'Information security lead, legal, HR, finance and at least one executive sponsor must have reviewed and agreed the label names and definitions', process:'Taxonomy sign-off document produced; label descriptions written in plain language (not technical language); pilot group identified for phase 02', technology:'MIP Scanner deployed and completed; AIP Unified Labelling client deployed to pilot group endpoints', licensing:'M365 E3 covers this phase', skip:false },
    tip:"Most organisations design too many labels. Aim for 3–5 at the top level, with sub-labels only where there is a genuine functional difference in how the data should be handled. Complexity in the taxonomy directly causes user confusion at the point of labelling." },
  { num:"02", zone:"DISCOVER", zoneColor:"#059669", color:"#059669",
    colorBg:(d)=>d?"rgba(5,150,105,0.10)":"rgba(5,150,105,0.08)",
    colorBorder:(d)=>d?"rgba(5,150,105,0.30)":"rgba(5,150,105,0.35)",
    title:"Labels Published — Pilot", subtitle:"Taxonomy live, voluntary application — continues to Default Label (phase 03)", icon:"🏷️", impact:"minimal",
    isPilot:true, pilotLabel:"CONTINUES TO PHASE 03",
    desc:"Publish the label taxonomy to a pilot group with no mandatory application, no default label, and no protection actions. Users can see and apply labels manually but nothing enforces it. This phase is purely about familiarity — letting users encounter labels in the ribbon without any friction or consequence. On completion the programme continues to Default Label Applied (phase 03) for all users.",
    config:[["Labels Published","Yes — pilot group","active"],["Default Label","None","off"],["Mandatory Labelling","Off","off"],["Protection Actions","None","off"],["Scope","Pilot group only","neutral"],["Next Phase","Continues to phase 03 (Default Label Applied)","active"]],
    outcomes:["Organic adoption baseline","User familiarity with label names","Voluntary application data","Taxonomy validation","Continues to phase 03 on completion"],
    license:{ base:'M365 E3', addOn:null, addOnFeatures:[], note:'Publishing labels to a pilot group and enabling manual application is included in M365 E3.' },
    zoneDesc:"Build familiarity with the label taxonomy before any enforcement. Get the taxonomy right before introducing any friction.",
    pilotWarning:"A common mistake is to pilot sensitivity labels only with IT staff or the security team. IT users are comfortable with classification concepts and rarely reflect how the broader organisation will behave. A meaningful label pilot must include people from finance, HR, legal, operations, and executive assistants — the roles that handle the most sensitive content every day. Watch which labels confuse them, which ones they skip, and which taxonomy names prompt questions. If a label name needs explaining, it needs renaming. The goal of this phase is not to prove that labels work technically — it is to prove that your taxonomy is intuitive enough for every type of user in your organisation.",
    nextPhase:{ time:'2–4 weeks', success:'Pilot users have encountered and voluntarily applied labels; taxonomy confusion points identified; no label names need renaming based on user feedback; organic adoption data collected', people:'Pilot group feedback collated (must include non-IT users); taxonomy owner reviewed feedback; comms plan for default label drafted', process:'Document which labels users found confusing; make any taxonomy changes before expanding; communicate the default label to all users', technology:'Review label usage analytics in Purview; confirm label policy is publishing correctly to all pilot endpoints and web apps', licensing:'M365 E3 covers this phase', skip:false },
    tip:"Collect voluntary application data during this phase. Which labels do users reach for most? Which do they avoid? This tells you whether your taxonomy makes sense to non-security people — the people who will use it every day." },
  { num:"03", zone:"DISCOVER", zoneColor:"#10b981", color:"#10b981", colorBg:(d)=>d?"rgba(16,185,129,0.07)":"rgba(16,185,129,0.06)", colorBorder:(d)=>d?"rgba(16,185,129,0.2)":"rgba(16,185,129,0.25)", title:"Default Label Applied", subtitle:"General label on all new content — users can change freely", icon:"📌", impact:"low",
    desc:"Configure a default label (typically 'General') that is automatically applied to new documents and emails. No encryption, no mandatory classification beyond the default. Users see the label but can change it freely. This is the first moment labels become part of every user's experience.",
    config:[["Labels Published","Yes — all users","active"],["Default Label","General (auto-applied)","active"],["Mandatory Labelling","Off","off"],["Protection Actions","None","off"],["User Override","Free — no justification required","neutral"]],
    outcomes:["Universal label visibility","Default classification baseline","Change management entry point","Users aware labels exist"],
    license:{ base:'M365 E3', addOn:null, addOnFeatures:[], note:'Applying a default label to new content is included in M365 E3 for Exchange and Office apps. Setting a default sensitivity label on a SharePoint document library requires M365 E3 or above.' },
    zoneDesc:"Introduce labels into the daily experience without forcing decisions. The default label means every file has a starting classification without user action.", nextPhase:{ time:'2–4 weeks', success:'Default label is applied consistently to new content; users understand what it means; no significant confusion or helpdesk spike; label analytics show the default label is appearing as expected', people:'All users communicated to before activation; helpdesk briefed; line managers aware', process:'Monitor helpdesk queries for label confusion; review label analytics weekly; prepare recommendation comms', technology:'Verify default label is applying in Outlook, Word, Excel, SharePoint; check mobile app behaviour', licensing:'M365 E3 covers this phase', skip:false },
    tip:"Communicate the default label clearly before you turn it on. Users will notice the label appearing on their files and emails — frame this as 'we've given everything a starting classification' rather than letting them discover it unexpectedly." },
  { num:"04", zone:"EDUCATE", zoneColor:BUI_ORANGE, color:BUI_ORANGE, colorBg:(d)=>d?"rgba(217,134,28,0.07)":"rgba(217,134,28,0.06)", colorBorder:(d)=>d?"rgba(217,134,28,0.2)":"rgba(217,134,28,0.25)", title:"Recommended Labelling", subtitle:"Client-side suggestions based on content — dismissible", icon:"💡", impact:"moderate",
    desc:"Enable label recommendations — Purview analyses content and suggests a label with a tooltip but doesn't force it. Users can dismiss the recommendation. This is the sensitivity labelling equivalent of a DLP policy tip: informational, non-blocking, but the first time the system is actively talking to users about classification.",
    config:[["Recommended Labels","On — client-side","active"],["Mandatory Labelling","Off","off"],["Protection Actions","None","off"],["User Override","Dismiss without justification","neutral"],["Scope","All users","active"]],
    outcomes:["Content-aware classification nudges","User classification accuracy data","Taxonomy tuning signal","Moderate change management required"],
    license:{ base:'M365 E3', addOn:'Purview Suite add-on', addOnFeatures:['Client-side automatic label recommendations based on content', 'Advanced trainable classifiers for recommendation conditions'], note:'Basic manual label application is E3. Client-side label recommendations driven by content inspection (automatic labelling) require the Purview Suite add-on.' },
    zoneDesc:"Drive behavioural change through guidance before enforcement. Users learn to classify through positive reinforcement rather than friction.", nextPhase:{ time:'4–6 weeks', success:'Recommendation acceptance rate is tracked and improving; mislabelling rate is understood; users are correctly overriding or accepting recommendations; taxonomy is stable with no pending changes', people:'All users aware of mandatory labelling coming; helpdesk trained on mandatory label queries; exec sponsor briefed', process:'Publish mandatory labelling communication with rationale; establish label exception/query process; define what happens when users are unsure', technology:'Configure mandatory labelling policy in Purview; test across all workloads (Outlook, Word, Excel, Teams, SharePoint); validate mobile behaviour', licensing:'M365 E3 covers mandatory labelling', skip:false },
    tip:"Expect helpdesk queries when recommendations go live. Some users will be confused about why the system is suggesting a label. A short awareness communication before activation ('you may see label suggestions — here's what they mean') significantly reduces ticket volume." },
  { num:"05", zone:"EDUCATE", zoneColor:BUI_ORANGE, color:BUI_ORANGE, colorBg:(d)=>d?"rgba(217,134,28,0.07)":"rgba(217,134,28,0.06)", colorBorder:(d)=>d?"rgba(217,134,28,0.2)":"rgba(217,134,28,0.25)", title:"Mandatory Labelling", subtitle:"Must classify before saving or sending — no protection yet", icon:"⚠️", impact:"elevated",
    desc:"Users must apply a label before saving a document or sending an email — they cannot proceed without classifying. No encryption yet. This is the most significant change management moment in the labelling journey — more impactful than encryption — because it affects every single save and send action. Executive sponsorship and a well-designed taxonomy are non-negotiable.",
    config:[["Mandatory Labelling","On","warn"],["Default Label","General (fallback)","active"],["Protection Actions","None","off"],["User Override","Must select label to proceed","warn"],["Scope","All users — all workloads","active"]],
    outcomes:["100% classified content","High user awareness","Robust taxonomy validation","Elevated helpdesk volume expected"],
    license:{ base:'M365 E3', addOn:null, addOnFeatures:[], note:'Mandatory labelling (requiring users to classify before saving or sending) is a label policy setting included in M365 E3.' },
    zoneDesc:"Mandatory labelling is the pivotal enforcement milestone. Every user is now a data classifier — the taxonomy must be intuitive enough to support this.", nextPhase:{ time:'4–8 weeks stable before encryption', success:'Mandatory labelling has been stable for at least 4 weeks; mislabelling rate is below agreed threshold (typically <5%); no pending taxonomy changes; pilot group identified for encryption testing', people:'Executive sponsor confirmed for encryption phase; IT team trained on encrypted document behaviour; helpdesk briefed on co-authoring and access issues', process:'Define encryption scope precisely (Highly Confidential label only initially); test co-authoring and external sharing workflows with pilot group; document exception process for encryption access', technology:'Verify Azure RMS is configured in tenant; test AIP Unified Labelling client across all devices; validate co-authoring works for licensed users', licensing:'Purview Suite add-on required for encryption (Azure RMS). Confirm all affected users are licensed before activation', skip:false },
    tip:"The taxonomy must be good before this phase. If users regularly cannot decide between two labels, they will either always pick the wrong one or raise a helpdesk ticket. Any confusion that existed in earlier phases will be amplified here." },
  { num:"06", zone:"ENFORCE", zoneColor:"#ef4444", color:"#ef4444", colorBg:(d)=>d?"rgba(239,68,68,0.07)":"rgba(239,68,68,0.06)", colorBorder:(d)=>d?"rgba(239,68,68,0.2)":"rgba(239,68,68,0.25)", title:"Encryption — Top Labels", subtitle:"Protection applied to Highly Confidential only", icon:"🔐", impact:"elevated",
    desc:"Apply encryption (Azure RMS / Microsoft Purview Information Protection) to Highly Confidential labels only. This is where workflows can genuinely break — co-authoring limitations, third-party app compatibility, external sharing friction. Scope tightly and pilot before broad rollout.",
    config:[["Encryption","On — Highly Confidential only","warn"],["Co-authoring","Enabled (requires AIP UL client)","active"],["External Sharing","Restricted by label policy","warn"],["Protection Actions","Encrypt + access control","warn"],["Scope","Pilot first, then all users","neutral"]],
    outcomes:["Encrypted highly confidential content","Access-controlled sensitive data","Workflow impact data from pilot","External sharing controls active"],
    license:{ base:'M365 E3', addOn:'Purview Suite add-on', addOnFeatures:['Encryption via Azure Rights Management on Highly Confidential labels', 'Co-authoring on encrypted documents', 'External sharing access controls via label protection'], note:'Applying a label and visual markings is E3. Encryption actions within label protection (Azure RMS) require the Purview Suite add-on (previously M365 E5 Compliance / AIP P2).' },
    zoneDesc:"Encryption makes labels real. Protection is now enforced technically, not just visually.", nextPhase:{ time:'8–12 weeks after encryption on top labels is stable', success:'No legitimate workflow disruptions from Highly Confidential encryption; co-authoring working; external sharing process understood; mislabelling rate remains low; Confidential label scope defined', people:'Executive sponsor must sign off before broadening encryption; legal and compliance aligned on external sharing controls; all affected users notified 2 weeks in advance', process:'Define do-not-forward/do-not-copy scope; test external sharing with representative partners; establish process for granting access to encrypted content', technology:'Validate encryption on Confidential label across all workloads; test DLP label-conditioned policies if applicable; confirm Purview Suite licensing covers all users', licensing:'Purview Suite add-on required for all users receiving encrypted content', skip:false },
    tip:"Pilot encryption with a small group of power users first — ideally from departments that handle highly confidential data regularly. Identify co-authoring and external sharing edge cases before broad rollout. Document every workflow disruption and resolve it before expanding scope." },
  { num:"06", zone:"ENFORCE", zoneColor:"#ef4444", color:"#ef4444", colorBg:(d)=>d?"rgba(239,68,68,0.07)":"rgba(239,68,68,0.06)", colorBorder:(d)=>d?"rgba(239,68,68,0.2)":"rgba(239,68,68,0.25)", title:"Encryption Broadened + DLP Convergence", subtitle:"Confidential encrypted; label-conditioned DLP policies active", icon:"🔒", impact:"high",
    desc:"Extend encryption to Confidential labels and configure do-not-forward, do-not-copy, and external sharing restrictions. At this point labels have real teeth. This is also where DLP and labelling converge — your hardest DLP policies should now be conditioned on sensitivity labels, not raw content inspection. Both frameworks must be mature simultaneously to reach this point safely.",
    config:[["Encryption","On — Confidential + Highly Confidential","danger"],["Label-conditioned DLP","Active — hard block on labelled content","danger"],["External Sharing","Blocked for Confidential+","danger"],["DLP Convergence","Label conditions replace content rules","active"],["Scope","All users — all workloads","active"]],
    outcomes:["Label-conditioned DLP enforcement","Broad encryption coverage","External sharing fully controlled","Unified data protection posture"],
    license:{ base:'Purview Suite add-on', addOn:'Purview Suite add-on', addOnFeatures:['Encryption on Confidential labels (Azure RMS)', 'Do-not-forward and do-not-copy restrictions', 'Label-conditioned DLP hard block policies', 'External sharing blocked via label policy'], note:'This phase requires the Purview Suite add-on for all encryption and label-conditioned DLP actions. Both the DLP and Labelling tracks must be at Purview Suite licensing tier to reach convergence.' },
    zoneDesc:"The convergence of DLP and labelling into a unified protection posture. This is the end-state of a mature Purview deployment.", nextPhase:{ time:'Ongoing', success:'Label-conditioned DLP policies active and stable; auto-labelling scope being planned; taxonomy governance programme established', people:'Named label taxonomy owner; quarterly taxonomy review group; DLP and labelling owners aligned', process:'Quarterly label review; stale label retirement process; exception lifecycle management', technology:'Consider auto-labelling policies (service-side); Content Explorer and Activity Explorer for analytics; Insider Risk Management integration', licensing:'Auto-labelling and analytics require Purview Suite add-on', skip:false },
    tip:"Do not reach for label-conditioned DLP hard blocks until your labelling accuracy is high. If users frequently mislabel content, a DLP policy that blocks on 'Highly Confidential' will generate false positives based on the label error, not the content itself. Labelling phase 05 maturity is a pre-requisite for this phase." },
  { num:"07", zone:"GOVERN", zoneColor:BUI_GRAY, color:BUI_GRAY, colorBg:(d)=>d?"rgba(83,86,87,0.07)":"rgba(83,86,87,0.06)", colorBorder:(d)=>d?"rgba(83,86,87,0.2)":"rgba(83,86,87,0.25)", title:"Auto-labelling & Governance", subtitle:"Service-side policies, label analytics, lifecycle management", icon:"♻️", impact:"minimal",
    desc:"Move from client-side recommendations to server-side auto-labelling policies in Exchange, SharePoint, and OneDrive. Labels are applied automatically based on content inspection, without user action. Establish a formal label governance programme: taxonomy reviews, stale label retirement, analytics, and integration with Conditional Access and Insider Risk Management.",
    config:[["Auto-labelling","On — service-side","active"],["Label Analytics","Active — Purview dashboard","active"],["Taxonomy Reviews","Quarterly cadence","active"],["Conditional Access","Integrated with label conditions","active"],["Governance Owner","Named label taxonomy owner","active"]],
    outcomes:["Automated classification coverage","Label lifecycle governance","Analytics-driven taxonomy tuning","Integration with Conditional Access"],
    license:{ base:'Purview Suite add-on', addOn:'Purview Suite add-on', addOnFeatures:['Service-side auto-labelling policies (Exchange, SharePoint, OneDrive)', 'Advanced trainable classifiers for auto-labelling', 'Label analytics in Content Explorer and Activity Explorer'], note:'Server-side auto-labelling requires the Purview Suite add-on. This is the most license-intensive phase in the labelling track.' },
    zoneDesc:"Sustain the labelling programme through automation and governance. Labels that aren't governed become stale and untrustworthy.", nextPhase:{ skip:true },
    tip:"Auto-labelling is not the starting point — it belongs here, late in the maturity model. Apply simulation mode to auto-labelling policies before activating them in enforcement mode. Users may be surprised to find files labelled and encrypted without touching them — communication is still required even at this automated stage." },
];

const zones = [
  { name:"DISCOVER", color:"#10b981" },
  { name:"EDUCATE",  color:BUI_ORANGE },
  { name:"ENFORCE",  color:"#ef4444" },
  { name:"GOVERN",   color:BUI_GRAY },
];

// ── SMALL COMPONENTS ──────────────────────────────────────────────────────────
function Pips({ score, color, empty, size=7 }) {
  return (
    <div style={{ display:"flex", gap:3 }}>
      {Array.from({length:5}).map((_,i)=>(
        <div key={i} style={{ width:size, height:size, borderRadius:"50%", background: i<score ? color : empty, transition:"background 0.2s" }}/>
      ))}
    </div>
  );
}

function ThemeToggle({ dark, onToggle, t }) {
  return (
    <button onClick={onToggle} style={{ display:"flex", alignItems:"center", gap:8, padding:"6px 14px", borderRadius:99, cursor:"pointer", background: dark?"rgba(255,255,255,0.06)":"rgba(0,0,0,0.06)", border:`1px solid ${dark?"rgba(255,255,255,0.12)":"rgba(0,0,0,0.12)"}`, transition:"all 0.2s", fontFamily:CAL }}>
      <div style={{ width:36, height:20, borderRadius:10, position:"relative", background: dark?BUI_ORANGE:"rgba(0,0,0,0.15)", transition:"background 0.25s", border:`1px solid ${dark?BUI_ORANGE+"80":"rgba(0,0,0,0.15)"}`, flexShrink:0 }}>
        <div style={{ position:"absolute", top:2, left: dark?18:2, width:14, height:14, borderRadius:"50%", background:"#fff", transition:"left 0.22s cubic-bezier(.4,0,.2,1)", boxShadow:"0 1px 3px rgba(0,0,0,0.3)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:13 }}>
          {dark?"☀":"☾"}
        </div>
      </div>
      <span style={{ fontSize:12, color:t.text4, letterSpacing:"0.05em", fontWeight:600 }}>{dark?"DARK":"LIGHT"}</span>
    </button>
  );
}

function UserImpactPanel({ impactKey, dark, t }) {
  const imp = impactLevels[impactKey];
  const urgencyConfig = {
    low:      { label:"Change Management: Low",      bg:"rgba(16,185,129,0.1)",  color:"#059669",  border:"rgba(16,185,129,0.2)" },
    high:     { label:"Change Management: High",     bg:"rgba(217,134,28,0.1)",  color:BUI_ORANGE, border:"rgba(217,134,28,0.25)" },
    critical: { label:"Change Management: Critical", bg:"rgba(239,68,68,0.1)",   color:"#ef4444",  border:"rgba(239,68,68,0.25)" },
  };
  const urg = urgencyConfig[imp.cmUrgency];
  return (
    <div style={{ background:imp.colorBg(dark), border:`1px solid ${imp.colorBorder(dark)}`, borderRadius:12, overflow:"hidden", marginBottom:18 }}>
      <div style={{ padding:"14px 20px", borderBottom:`1px solid ${imp.colorBorder(dark)}`, display:"flex", alignItems:"center", justifyContent:"space-between", gap:16 }}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <div style={{ fontSize:11, fontWeight:700, letterSpacing:"0.1em", color:imp.color }}>USER IMPACT</div>
          <div style={{ fontSize:11, fontWeight:700, color:imp.color, background:`${imp.color}18`, padding:"3px 12px", borderRadius:99, border:`1px solid ${imp.color}40` }}>{imp.level}</div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:6 }}>
          <span style={{ fontSize:13, color:t.text4, marginRight:4 }}>Impact level</span>
          <Pips score={imp.score} color={imp.color} empty={t.pipEmpty} size={14}/>
        </div>
      </div>
      <div style={{ padding:"14px 20px 0" }}>
        <p style={{ fontSize:14, color:t.text2, lineHeight:1.65, margin:0 }}>{imp.summary}</p>
      </div>
      {imp.personas.length > 0 && (
        <div style={{ padding:"12px 20px 0" }}>
          <div style={{ fontSize:11, color:t.text5, letterSpacing:"0.09em", fontWeight:700, marginBottom:8 }}>AFFECTED PERSONAS</div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
            {imp.personas.map((p,i)=>(
              <span key={i} style={{ fontSize:13, padding:"3px 11px", borderRadius:99, background:`${imp.color}12`, color:imp.color, border:`1px solid ${imp.color}30` }}>{p}</span>
            ))}
          </div>
        </div>
      )}
      <div style={{ padding:"14px 20px" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
          <div style={{ fontSize:13, color:t.text5, letterSpacing:"0.09em", fontWeight:700 }}>CHANGE MANAGEMENT ACTIVITIES</div>
          <span style={{ fontSize:13, padding:"2px 10px", borderRadius:99, background:urg.bg, color:urg.color, border:`1px solid ${urg.border}`, fontWeight:700 }}>{urg.label}</span>
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
          {imp.cmActions.map((action,i)=>(
            <div key={i} style={{ display:"flex", alignItems:"flex-start", gap:10, padding:"9px 12px", background:t.cmItem, borderRadius:8, border:`1px solid ${t.cmItemBorder}` }}>
              <div style={{ width:20, height:20, borderRadius:"50%", flexShrink:0, background:`${imp.color}20`, border:`1px solid ${imp.color}40`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:700, color:imp.color, marginTop:1 }}>{i+1}</div>
              <span style={{ fontSize:14, color:t.text3, lineHeight:1.55 }}>{action}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


// ── ROADMAP OVERVIEW ─────────────────────────────────────────────────────────
// Phase durations in weeks — drives proportional block widths
const DLP_DURATIONS    = [3, 3, 3, 6, 8, 12, 12];   // 7 DLP phases
const LABEL_DURATIONS  = [6, 3, 3, 5, 6, 8, 10, 12]; // 8 Label phases

const ZONE_COLORS = { DISCOVER:"#10b981", EDUCATE:BUI_ORANGE, ENFORCE:"#ef4444", GOVERN:BUI_GRAY };

function RoadmapView({ dark, t, setDlpActive, setDlpTab, setLabelActive, setLabelTab, setView }) {
  // lineX is 0..1 representing position across the full timeline width
  const [lineX, setLineX] = useState(0.55);
  const [dragging, setDragging] = useState(false);
  const [showScope, setShowScope] = useState(true);
  const containerRef = useRef(null);

  // Cumulative width offsets (0..1) for each track
  function getCumulative(durations) {
    const total = durations.reduce((a,b)=>a+b,0);
    let cum = 0;
    return durations.map(d => { const start = cum/total; cum += d; return { start, end: cum/total, width: d/total }; });
  }
  const dlpCum   = getCumulative(DLP_DURATIONS);
  const labelCum = getCumulative(LABEL_DURATIONS);

  // Which phase index is the boundary for a given track at current lineX
  function boundaryIndex(cum) {
    // last phase whose end <= lineX (fully covered), or -1 if none
    let last = -1;
    cum.forEach((c,i) => { if (lineX >= c.end) last = i; });
    return last; // -1 = nothing covered, phases.length-1 = all covered
  }
  const dlpBound   = boundaryIndex(dlpCum);
  const labelBound = boundaryIndex(labelCum);

  // Pointer drag handlers — attach to the container div
  function onPointerDown(e) {
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragging(true);
    updateLine(e);
  }
  function onPointerMove(e) {
    if (!dragging) return;
    updateLine(e);
  }
  function onPointerUp(e) {
    setDragging(false);
  }
  function updateLine(e) {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setLineX(x);
  }

  // Label for current boundary
  function boundaryLabel(cum, phases, bound) {
    if (bound < 0) return "Not started";
    if (bound >= phases.length - 1) return "Full adoption";
    return `After phase ${phases[bound].num} — ${phases[bound].title}`;
  }

  // Total weeks for scale bar
  const dlpTotal   = DLP_DURATIONS.reduce((a,b)=>a+b,0);   // 47
  const labelTotal = LABEL_DURATIONS.reduce((a,b)=>a+b,0);  // 53
  const maxWeeks   = Math.max(dlpTotal, labelTotal);         // 53

  function TrackRow({ phases, durations, cum, bound, trackLabel, trackColor, onPhaseClick }) {
    const TRACK_H = 96;
    return (
      <div style={{ marginBottom:6 }}>
        {/* Track label */}
        <div style={{ fontSize:11, fontWeight:700, letterSpacing:"0.09em", color:trackColor, marginBottom:5, fontFamily:CAL }}>{trackLabel}</div>
        {/* Phase blocks — proportional widths */}
        <div style={{ position:"relative", height:TRACK_H, display:"flex", gap:2 }}>
          {phases.map((p, i) => {
            const covered  = i <= bound;
            const isEdge   = i === bound; // last covered phase
            const zColor   = ZONE_COLORS[p.zone] || "#94a3b8";
            // Scale width relative to maxWeeks so both tracks align on the same time axis
            const widthPct = (durations[i] / maxWeeks * 100).toFixed(2) + "%";
            return (
              <div key={i}
                onClick={()=>onPhaseClick(i)}
                style={{
                  width: widthPct, flexShrink:0, height:TRACK_H,
                  borderRadius:5, overflow:"hidden", cursor:"pointer",
                  opacity: showScope ? (covered ? 1 : 0.32) : 1,
                  border: showScope && isEdge ? `2px solid ${BUI_ORANGE}` : `1px solid ${covered ? p.zoneColor+"55" : t.border}`,
                  boxShadow: showScope && isEdge ? `0 0 0 3px ${BUI_ORANGE}22` : "none",
                  transition:"opacity 0.15s, border 0.15s",
                  display:"flex", flexDirection:"column",
                }}>
                {/* Zone colour band at top */}
                <div style={{ height:5, background: covered ? p.zoneColor : zColor, opacity: covered?1:0.4, flexShrink:0 }}/>
                {/* Content */}
                <div style={{
                  flex:1, background: covered ? `${p.zoneColor}18` : (dark?"rgba(255,255,255,0.03)":"rgba(0,0,0,0.03)"),
                  padding:"5px 5px 3px", display:"flex", flexDirection:"column", justifyContent:"space-between",
                }}>
                  <div>
                    <div style={{ fontSize:11, fontWeight:700, color: covered?p.zoneColor:p.zoneColor, letterSpacing:"0.05em", lineHeight:1.2, fontFamily:CAL }}>{p.zone}</div>
                    <div style={{ fontSize:12, fontWeight:700, color: covered?t.text1:t.text4, lineHeight:1.25, marginTop:2, fontFamily:CAL }}>{p.title}</div>
                    {p.isPilot && <div style={{ fontSize:10, color:p.zoneColor, background:`${p.zoneColor}15`, padding:"1px 4px", borderRadius:99, display:"inline-block", marginTop:2, border:`1px solid ${p.zoneColor}40`, fontFamily:CAL }}>PILOT</div>}
                  </div>
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                    <span style={{ fontSize:11, color: covered?t.text3:t.text5, fontFamily:CAL }}>{durations[i]}w</span>
                    <span style={{ fontSize:11, fontWeight:700, color: covered?p.zoneColor:t.text5, fontFamily:CAL }}>{p.num}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <main style={{ flex:1, overflowY:"auto", padding:"24px 36px", background:t.bg, fontFamily:CAL }}>

      {/* Title */}
      <div style={{ marginBottom:18 }}>
        <h1 style={{ fontSize:22, fontWeight:700, color:t.text1, margin:"0 0 4px", fontFamily:CAL }}>Purview Adoption Roadmap</h1>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:16 }}>
          <p style={{ fontSize:14, color:t.text4, margin:0, fontFamily:CAL }}>{showScope ? "Phase widths are proportional to typical duration. Drag the orange line to set the BUI engagement boundary." : "Phase widths are proportional to typical duration. All phases shown — toggle scope to set the engagement boundary."}</p>
          <button onClick={()=>setShowScope(s=>!s)} style={{
            flexShrink:0, display:"flex", alignItems:"center", gap:8, padding:"8px 16px",
            borderRadius:99, cursor:"pointer", fontFamily:CAL, fontSize:14, fontWeight:600,
            background: showScope ? `${BUI_ORANGE}15` : (dark?"rgba(255,255,255,0.06)":"rgba(0,0,0,0.06)"),
            border: `1.5px solid ${showScope ? BUI_ORANGE : (dark?"rgba(255,255,255,0.15)":"rgba(0,0,0,0.15)")}`,
            color: showScope ? BUI_ORANGE : t.text3, transition:"all 0.18s",
          }}>
            <div style={{ width:32, height:18, borderRadius:9, position:"relative",
              background: showScope ? BUI_ORANGE : (dark?"rgba(255,255,255,0.15)":"rgba(0,0,0,0.15)"),
              transition:"background 0.2s", flexShrink:0,
            }}>
              <div style={{ position:"absolute", top:2, left: showScope?16:2, width:12, height:12,
                borderRadius:"50%", background:"#fff", transition:"left 0.18s cubic-bezier(.4,0,.2,1)",
                boxShadow:"0 1px 3px rgba(0,0,0,0.25)" }}/>
            </div>
            BUI Scope Line
          </button>
        </div>
      </div>

      {/* ── MAIN GANTT CARD ── */}
      <div style={{ background:t.bgCard, border:`1px solid ${t.border}`, borderRadius:14, padding:"20px 22px 16px", boxShadow:t.shadow, marginBottom:16 }}>

        {/* Boundary labels — only when scope line visible */}
        {showScope && <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:16 }}>
          {[
            { label:"DLP", color:"#3b82f6",  text: boundaryLabel(dlpCum,   dlpPhases,   dlpBound)   },
            { label:"Labelling", color:"#a78bfa", text: boundaryLabel(labelCum, labelPhases, labelBound) },
          ].map(b=>(
            <div key={b.label} style={{ padding:"8px 14px", borderRadius:8, background:dark?`${b.color}0a`:`${b.color}08`, border:`1px solid ${b.color}25` }}>
              <span style={{ fontSize:11, fontWeight:700, color:b.color, letterSpacing:"0.09em", marginRight:8, fontFamily:CAL }}>{b.label} ENGAGEMENT ENDS</span>
              <span style={{ fontSize:11, fontWeight:700, color:t.text1, fontFamily:CAL }}>{b.text}</span>
            </div>
          ))}
        </div>}

        {/* ── DRAGGABLE GANTT AREA ── */}
        <div
          ref={containerRef}
          onPointerDown={showScope ? onPointerDown : undefined}
          onPointerMove={showScope ? onPointerMove : undefined}
          onPointerUp={showScope ? onPointerUp : undefined}
          style={{ position:"relative", cursor: showScope?(dragging?"grabbing":"grab"):"default", userSelect:"none", touchAction:"none" }}
        >
          {/* DLP track */}
          <TrackRow
            phases={dlpPhases} durations={DLP_DURATIONS} cum={dlpCum} bound={dlpBound}
            trackLabel="DLP MATURITY" trackColor="#3b82f6"
            onPhaseClick={(i)=>{ setDlpActive(i); setDlpTab("overview"); setView("dlp"); }}
          />

          <div style={{ height:10 }}/>

          {/* Label track */}
          <TrackRow
            phases={labelPhases} durations={LABEL_DURATIONS} cum={labelCum} bound={labelBound}
            trackLabel="SENSITIVITY LABELLING" trackColor="#a78bfa"
            onPhaseClick={(i)=>{ setLabelActive(i); setLabelTab("overview"); setView("labels"); }}
          />

          {/* ── VERTICAL DRAG LINE — only when scope enabled ── */}
          {showScope && <div style={{
            position:"absolute", top:0, bottom:0,
            left:`${lineX*100}%`,
            width:2,
            background:BUI_ORANGE,
            pointerEvents:"none",
            zIndex:10,
          }}>
            {/* Top handle */}
            <div style={{
              position:"absolute", top:-8, left:"50%", transform:"translateX(-50%)",
              width:18, height:18, borderRadius:"50%",
              background:BUI_ORANGE, border:"2.5px solid #fff",
              boxShadow:"0 2px 6px rgba(0,0,0,0.35)",
              display:"flex", alignItems:"center", justifyContent:"center",
            }}>
              <div style={{ width:3, height:3, borderRadius:"50%", background:"#fff" }}/>
            </div>
            {/* Label */}
            <div style={{
              position:"absolute", top:22, left:6,
              background:BUI_ORANGE, color:"#fff",
              fontSize:11, fontWeight:700, letterSpacing:"0.06em",
              padding:"2px 7px", borderRadius:99,
              whiteSpace:"nowrap", fontFamily:CAL,
              boxShadow:"0 1px 4px rgba(0,0,0,0.2)",
            }}>BUI SCOPE</div>
            {/* Bottom handle */}
            <div style={{
              position:"absolute", bottom:-8, left:"50%", transform:"translateX(-50%)",
              width:18, height:18, borderRadius:"50%",
              background:BUI_ORANGE, border:"2.5px solid #fff",
              boxShadow:"0 2px 6px rgba(0,0,0,0.35)",
            }}/>
          </div>}
        </div>

        {/* ── WEEK SCALE BAR ── */}
        <div style={{ marginTop:10, position:"relative" }}>
          <div style={{ display:"flex", borderTop:`1px solid ${t.border}`, paddingTop:6 }}>
            {Array.from({length: Math.ceil(maxWeeks/4)+1}).map((_,i)=>(
              <div key={i} style={{ flex:1, maxWidth:`${4/maxWeeks*100}%` }}>
                <div style={{ fontSize:11, color:t.text5, fontFamily:CAL }}>w{i*4}</div>
              </div>
            ))}
          </div>
          <div style={{ fontSize:11, color:t.text5, marginTop:2, fontFamily:CAL }}>Approximate weeks from engagement start</div>
        </div>
      </div>

      {/* ── LEGEND ── */}
      <div style={{ display:"flex", gap:20, flexWrap:"wrap", marginBottom:16 }}>
        <div style={{ display:"flex", alignItems:"center", gap:6, fontSize:13, color:t.text3, fontFamily:CAL }}>
          <div style={{ width:24, height:8, borderRadius:2, background:"linear-gradient(90deg,#10b981,"+BUI_ORANGE+")" }}/>
          <span>Within BUI engagement scope</span>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:6, fontSize:13, color:t.text3, fontFamily:CAL }}>
          <div style={{ width:24, height:8, borderRadius:2, background: dark?"rgba(255,255,255,0.08)":"rgba(0,0,0,0.08)" }}/>
          <span>Customer continues independently</span>
        </div>
        {showScope && <div style={{ display:"flex", alignItems:"center", gap:6, fontSize:13, color:t.text3, fontFamily:CAL }}>
          <div style={{ width:2, height:16, background:BUI_ORANGE }}/>
          <span>Engagement boundary (drag to adjust)</span>
        </div>}
        {[{z:"DISCOVER",c:"#10b981"},{z:"EDUCATE",c:BUI_ORANGE},{z:"ENFORCE",c:"#ef4444"},{z:"GOVERN",c:BUI_GRAY}].map(z=>(
          <div key={z.z} style={{ display:"flex", alignItems:"center", gap:5, fontSize:13, color:t.text3, fontFamily:CAL }}>
            <div style={{ width:10, height:10, borderRadius:2, background:z.c }}/>
            <span>{z.z}</span>
          </div>
        ))}
      </div>

      {/* ── SMART CALLOUT ── */}
      {dlpBound >= 5 && labelBound >= 6 && (
        <div style={{ padding:"12px 16px", borderRadius:10, background:"rgba(16,185,129,0.08)", border:"1px solid rgba(16,185,129,0.25)", marginBottom:12 }}>
          <div style={{ fontSize:11, fontWeight:700, color:"#10b981", letterSpacing:"0.08em", marginBottom:4, fontFamily:CAL }}>CONVERGENCE SCOPE REACHED</div>
          <p style={{ fontSize:14, color:t.text3, margin:0, lineHeight:1.55, fontFamily:CAL }}>Both tracks are scoped to the convergence point. Label-conditioned DLP hard block policies are within scope of the engagement.</p>
        </div>
      )}
      {((dlpBound - labelBound) > 2) && (
        <div style={{ padding:"12px 16px", borderRadius:10, background:`${BUI_ORANGE}0a`, border:`1px solid ${BUI_ORANGE}30`, marginBottom:12 }}>
          <div style={{ fontSize:11, fontWeight:700, color:BUI_ORANGE, letterSpacing:"0.08em", marginBottom:4, fontFamily:CAL }}>TRACK ALIGNMENT NOTE</div>
          <p style={{ fontSize:14, color:t.text3, margin:0, lineHeight:1.55, fontFamily:CAL }}>DLP is significantly ahead of Labelling in scope. Hard DLP policies conditioned on sensitivity labels won't be effective until labelling reaches mandatory classification (phase 05).</p>
        </div>
      )}
      {((labelBound - dlpBound) > 2) && (
        <div style={{ padding:"12px 16px", borderRadius:10, background:`${BUI_ORANGE}0a`, border:`1px solid ${BUI_ORANGE}30`, marginBottom:12 }}>
          <div style={{ fontSize:11, fontWeight:700, color:BUI_ORANGE, letterSpacing:"0.08em", marginBottom:4, fontFamily:CAL }}>TRACK ALIGNMENT NOTE</div>
          <p style={{ fontSize:14, color:t.text3, margin:0, lineHeight:1.55, fontFamily:CAL }}>Labelling is significantly ahead of DLP in scope. Ensure DLP policies are progressed to use label conditions before broad encryption is applied.</p>
        </div>
      )}

      <div style={{ fontSize:14, color:t.text4, lineHeight:1.55, fontFamily:CAL }}>
        <span style={{ fontWeight:700, color:t.text3 }}>Tip: </span>
        Click any phase to jump to its detail. {showScope ? "Drag the orange line to set the engagement scope — it moves across both tracks at once." : "Toggle 'BUI Scope Line' to show the draggable engagement boundary."} Phase widths reflect typical duration — wider blocks take longer.
      </div>

    </main>
  );
}


// ── TRACK DETAIL VIEW (shared by both DLP + Label tracks) ─────────────────────
function TrackDetailView({ phases, active, setActive, tab, setTab, dark, t }) {
  const phase = phases[active];
  const imp   = impactLevels[phase.impact];
  const total = phases.length;

  const badgeStyles = {
    off:     dark?{bg:"rgba(255,255,255,0.03)",color:"#4b5563",border:"rgba(255,255,255,0.07)"}:{bg:"rgba(0,0,0,0.04)",color:"#9ca3af",border:"rgba(0,0,0,0.1)"},
    neutral: dark?{bg:"rgba(255,255,255,0.05)",color:"#9ca3af",border:"rgba(255,255,255,0.1)"}:{bg:"rgba(0,0,0,0.04)",color:"#6b7280",border:"rgba(0,0,0,0.1)"},
    active:  {bg:"rgba(16,185,129,0.1)",  color:"#059669", border:"rgba(16,185,129,0.25)"},
    warn:    {bg:"rgba(217,134,28,0.12)", color:BUI_ORANGE, border:"rgba(217,134,28,0.3)"},
    danger:  {bg:"rgba(239,68,68,0.1)",   color:"#ef4444",  border:"rgba(239,68,68,0.25)"},
  };

  function nav(dir) { setActive(a=>Math.max(0,Math.min(total-1,a+dir))); setTab("overview"); }

  return (
    <div style={{ display:"flex", flex:1, overflow:"hidden" }}>
      {/* Sidebar */}
      <aside style={{ width:300, flexShrink:0, background:t.bgSidebar, borderRight:`1px solid ${t.border}`, overflowY:"auto", padding:"10px 0", transition:"background 0.25s" }}>
        {phases.map((p,i)=>{
          const on = active===i;
          const pImp = impactLevels[p.impact];
          if (p.isPilot) {
            return (
              <div key={i}>
                <div style={{ margin:"6px 14px", borderTop:`1px dashed ${p.color}50` }}/>
                <button onClick={()=>{setActive(i);setTab("overview");}} style={{ width:"100%", padding:"10px 14px", textAlign:"left", background:on?`${p.color}0e`:"transparent", border:"none", borderLeft:`3px solid ${on?p.color:"transparent"}`, cursor:"pointer", display:"flex", alignItems:"center", gap:10, transition:"all 0.14s" }}>
                  <div style={{ width:34, height:34, borderRadius:8, flexShrink:0, background:on?`${p.color}18`:t.sidebarItem, border:`1px solid ${on?p.color+"80":p.color+"40"}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:13 }}>{p.icon}</div>
                  <div style={{ minWidth:0, flex:1 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:5, marginBottom:2 }}>
                      <span style={{ fontSize:11, fontWeight:700, letterSpacing:"0.1em", color:p.color, background:`${p.color}18`, padding:"1px 6px", borderRadius:99, border:`1px solid ${p.color}60` }}>PILOT</span>
                    </div>
                    <div style={{ fontSize:14, fontWeight:on?700:400, color:on?t.text1:t.text4, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{p.title}</div>
                    <div style={{ fontSize:12, color:p.color, opacity:0.75, marginTop:2 }}>{p.pilotLabel ? `→ ${p.pilotLabel.toLowerCase()}` : "→ continues to phase 03"}</div>
                  </div>
                </button>
                <div style={{ margin:"6px 14px", borderTop:`1px dashed ${p.color}50` }}/>
              </div>
            );
          }
          return (
            <button key={i} onClick={()=>{setActive(i);setTab("overview");}} style={{ width:"100%", padding:"10px 14px", textAlign:"left", background:on?`${p.color}0e`:"transparent", border:"none", borderLeft:`3px solid ${on?p.color:"transparent"}`, cursor:"pointer", display:"flex", alignItems:"center", gap:10, transition:"all 0.14s" }}>
              <div style={{ width:34, height:34, borderRadius:8, flexShrink:0, background:on?`${p.color}18`:t.sidebarItem, border:`1px solid ${on?p.color+"45":t.sidebarBorder}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:13 }}>{p.icon}</div>
              <div style={{ minWidth:0, flex:1 }}>
                <div style={{ fontSize:11, letterSpacing:"0.08em", fontWeight:700, marginBottom:1, color:on?p.color:t.text5 }}>{p.num} · {p.zone}</div>
                <div style={{ fontSize:14, fontWeight:on?700:400, color:on?t.text1:t.text4, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{p.title}</div>
                <div style={{ display:"flex", alignItems:"center", gap:5, marginTop:4 }}>
                  <Pips score={pImp.score} color={pImp.color} empty={t.pipEmpty} size={6}/>
                  <span style={{ fontSize:11, color:pImp.color, opacity:0.85, marginLeft:1 }}>{pImp.level}</span>
                  {p.license && <span style={{ marginLeft:"auto", fontSize:11, fontWeight:700, letterSpacing:"0.05em", padding:"1px 6px", borderRadius:99, background:p.license.addOn?`rgba(217,134,28,0.15)`:`rgba(16,185,129,0.12)`, color:p.license.addOn?BUI_ORANGE:"#059669", border:`1px solid ${p.license.addOn?"rgba(217,134,28,0.35)":"rgba(16,185,129,0.3)"}` }}>{p.license.addOn?"E3 +":"E3"}</span>}
                </div>
              </div>
            </button>
          );
        })}
      </aside>

      {/* Main */}
      <main style={{ flex:1, overflowY:"auto", padding:"28px 40px", background:t.bg, transition:"background 0.25s" }}>
        {/* Zone + phase + impact row */}
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10, flexWrap:"wrap" }}>
          <div style={{ fontSize:13, padding:"3px 11px", borderRadius:99, border:`1px solid ${phase.zoneColor}40`, color:phase.zoneColor, background:`${phase.zoneColor}0d`, letterSpacing:"0.1em", fontWeight:700 }}>{phase.zone}</div>
          <span style={{ fontSize:12, color:t.text5, letterSpacing:"0.08em" }}>{phase.isPilot ? `PHASE ${phase.num} OF ${String(total).padStart(2,"0")}` : `PHASE ${phase.num} OF ${String(total).padStart(2,"0")}`}</span>
          {phase.isPilot && <span style={{ fontSize:13, padding:"2px 9px", borderRadius:99, background:`${phase.color}12`, border:`1px dashed ${phase.color}80`, color:phase.color, fontWeight:700, letterSpacing:"0.08em" }}>{phase.pilotLabel || "CONTINUES TO PHASE 04"}</span>}
          <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:8 }}>
            {phase.license && (
              <div style={{ display:"flex", alignItems:"center", gap:5, padding:"4px 12px", borderRadius:99, background:phase.license.addOn?`rgba(217,134,28,0.1)`:`rgba(16,185,129,0.08)`, border:`1px solid ${phase.license.addOn?"rgba(217,134,28,0.3)":"rgba(16,185,129,0.25)"}` }}>
                <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><rect x="0.5" y="0.5" width="10" height="10" rx="2" stroke={phase.license.addOn?BUI_ORANGE:"#059669"} strokeWidth="1"/><path d="M2.5 5.5h6M5.5 2.5v6" stroke={phase.license.addOn?BUI_ORANGE:"#059669"} strokeWidth="1.2" strokeLinecap="round"/></svg>
                <span style={{ fontSize:11, fontWeight:700, letterSpacing:"0.06em", color:phase.license.addOn?BUI_ORANGE:"#059669" }}>{phase.license.addOn ? "E3 + Purview Suite" : "M365 E3"}</span>
              </div>
            )}
            <div style={{ display:"flex", alignItems:"center", gap:8, padding:"4px 14px 4px 10px", borderRadius:99, background:imp.colorBg(dark), border:`1px solid ${imp.colorBorder(dark)}` }}>
              <Pips score={imp.score} color={imp.color} empty={t.pipEmpty} size={8}/>
              <span style={{ fontSize:13, color:imp.color, fontWeight:700, letterSpacing:"0.06em" }}>{imp.level}</span>
            </div>
          </div>
        </div>

        <h1 style={{ fontSize:27, fontWeight:700, color:t.text1, margin:"0 0 5px", letterSpacing:"-0.02em", display:"flex", alignItems:"center", gap:12, fontFamily:CAL }}>
          <span style={{ fontSize:25 }}>{phase.icon}</span>{phase.title}
        </h1>
        <p style={{ fontSize:15, color:BUI_GRAY, margin:"0 0 22px", fontFamily:CAL }}>{phase.subtitle}</p>

        {/* Progress */}
        <div style={{ marginBottom:26 }}>
          <div style={{ height:4, background:dark?"rgba(255,255,255,0.05)":"rgba(0,0,0,0.07)", borderRadius:2, overflow:"hidden" }}>
            <div style={{ height:"100%", borderRadius:2, background:`linear-gradient(90deg, #10b981 0%, ${BUI_ORANGE} 57%, #ef4444 85%, ${BUI_GRAY} 100%)`, width:`${((active+1)/total)*100}%`, transition:"width 0.38s ease" }}/>
          </div>
          <div style={{ display:"flex", gap:5, marginTop:8, alignItems:"center" }}>
            {phases.map((p,i)=>(
              <div key={i} onClick={()=>{setActive(i);setTab("overview");}} title={`${p.isPilot?"PILOT: ":"Phase "+p.num+": "}${p.title}`}
                style={{ flex:p.isPilot?0.4:1, height:p.isPilot?3:5, borderRadius:3, cursor:"pointer",
                  background:p.isPilot?(i<=active?p.color:"transparent"):i<=active?p.color:t.pipEmpty,
                  outline:p.isPilot?`1px dashed ${i<=active?p.color:t.pipEmpty}`:undefined,
                  transition:"background 0.2s", opacity:i<=active?1:0.5 }}/>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display:"flex", gap:1, marginBottom:20, borderBottom:`1px solid ${t.border}` }}>
          {["overview","configuration","outcomes","licensing"].map(tabName=>(
            <button key={tabName} onClick={()=>setTab(tabName)} style={{ padding:"8px 20px", fontSize:13, border:"none", cursor:"pointer", background:"transparent", fontFamily:CAL, fontWeight:tab===tabName?700:400, color:tab===tabName?t.text1:t.text4, borderBottom:`2px solid ${tab===tabName?BUI_ORANGE:"transparent"}`, letterSpacing:"0.06em", transition:"all 0.14s", marginBottom:-1 }}>{tabName.toUpperCase()}</button>
          ))}
        </div>

        {/* Overview */}
        {tab==="overview" && (
          <div>
            <div style={{ background:phase.colorBg(dark), border:`1px solid ${phase.colorBorder(dark)}`, borderRadius:12, padding:"18px 22px", marginBottom:18 }}>
              <p style={{ fontSize:13, color:t.text2, lineHeight:1.75, margin:0, fontFamily:CAL }}>{phase.desc}</p>
            </div>
            {phase.pilotWarning && (
              <div style={{ background:dark?"rgba(239,68,68,0.07)":"rgba(239,68,68,0.06)", border:"1px solid rgba(239,68,68,0.3)", borderLeft:"3px solid #ef4444", borderRadius:"0 10px 10px 0", padding:"14px 20px", marginBottom:18 }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
                  <div style={{ width:8, height:8, borderRadius:"50%", background:"#ef4444", flexShrink:0 }}/>
                  <span style={{ fontSize:11, fontWeight:700, color:"#ef4444", letterSpacing:"0.1em" }}>IMPORTANT — PILOT COMPOSITION</span>
                </div>
                <p style={{ fontSize:14, color:t.text2, margin:0, lineHeight:1.65, fontFamily:CAL }}>{phase.pilotWarning}</p>
              </div>
            )}
            {phase.isPilot && (
              <div style={{ background:dark?`${phase.color}0d`:`${phase.color}08`, border:`1px dashed ${phase.color}60`, borderRadius:12, padding:"14px 20px", marginBottom:18 }}>
                <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8 }}>
                  <div style={{ width:8, height:8, borderRadius:"50%", background:phase.color, flexShrink:0 }}/>
                  <span style={{ fontSize:11, fontWeight:700, color:phase.color, letterSpacing:"0.1em" }}>{phase.pilotLabel ? `ON COMPLETION: ${phase.pilotLabel.replace("CONTINUES TO ","PHASE ")}` : "ON COMPLETION: PHASE 03"}</span>
                </div>
                <p style={{ fontSize:13, color:t.text3, margin:0, lineHeight:1.65, fontFamily:CAL }}>At the end of the pilot window the policy <span style={{fontWeight:700,color:t.text2}}>moves forward to phase 03 (Security Team Alerts)</span> — actions removed and scope expanded to all users. This is the confirmed entry point into the permanent maturity progression. Progression through the Educate zone follows from there.</p>
              </div>
            )}
            <UserImpactPanel impactKey={phase.impact} dark={dark} t={t}/>
            {phase.nextPhase && !phase.nextPhase.skip && (
              <div style={{ background:t.bgCard, border:`1px solid ${t.border}`, borderRadius:12, overflow:"hidden", marginBottom:18, boxShadow:t.shadow }}>
                <div style={{ padding:"12px 20px", background:dark?`${phase.color}0e`:`${phase.color}08`, borderBottom:`1px solid ${phase.color}25`, display:"flex", alignItems:"center", gap:8 }}>
                  <div style={{ width:8, height:8, borderRadius:"50%", background:phase.color }}/>
                  <span style={{ fontSize:11, fontWeight:700, color:phase.color, letterSpacing:"0.08em" }}>READY TO PROGRESS? — PEOPLE, PROCESS & TECHNOLOGY</span>
                </div>
                <div style={{ padding:"14px 20px" }}>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:10 }}>
                    {[
                      { icon:"⏱", label:"Typical time in this phase", value:phase.nextPhase.time, color:"#06b6d4" },
                      { icon:"✓", label:"Success looks like", value:phase.nextPhase.success, color:"#10b981" },
                    ].map((item,i)=>(
                      <div key={i} style={{ padding:"10px 14px", borderRadius:8, background:dark?`${item.color}0a`:`${item.color}08`, border:`1px solid ${item.color}25` }}>
                        <div style={{ fontSize:11, fontWeight:700, color:item.color, letterSpacing:"0.08em", marginBottom:5 }}>{item.icon} {item.label.toUpperCase()}</div>
                        <p style={{ fontSize:14, color:t.text2, margin:0, lineHeight:1.55, fontFamily:CAL }}>{item.value}</p>
                      </div>
                    ))}
                  </div>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10 }}>
                    {[
                      { icon:"👥", label:"People", value:phase.nextPhase.people, color:"#a78bfa" },
                      { icon:"⚙", label:"Process", value:phase.nextPhase.process, color:BUI_ORANGE },
                      { icon:"💻", label:"Technology & licensing", value:`${phase.nextPhase.technology} | ${phase.nextPhase.licensing}`, color:"#3b82f6" },
                    ].map((item,i)=>(
                      <div key={i} style={{ padding:"10px 14px", borderRadius:8, background:dark?`${item.color}0a`:`${item.color}08`, border:`1px solid ${item.color}25` }}>
                        <div style={{ fontSize:11, fontWeight:700, color:item.color, letterSpacing:"0.08em", marginBottom:5 }}>{item.icon} {item.label.toUpperCase()}</div>
                        <p style={{ fontSize:14, color:t.text2, margin:0, lineHeight:1.55, fontFamily:CAL }}>{item.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div style={{ background:dark?`${BUI_ORANGE}09`:`${BUI_ORANGE}0d`, borderLeft:`3px solid ${BUI_ORANGE}`, border:`1px solid ${BUI_ORANGE}28`, borderRadius:"0 10px 10px 0", padding:"14px 20px" }}>
              <div style={{ fontSize:11, color:BUI_ORANGE, letterSpacing:"0.1em", fontWeight:700, marginBottom:7 }}>BUI PRACTITIONER TIP</div>
              <p style={{ fontSize:14, color:t.text3, lineHeight:1.65, margin:0, fontFamily:CAL }}>{phase.tip}</p>
            </div>
          </div>
        )}

        {/* Licensing */}
        {tab==="licensing" && phase.license && (
          <div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:18 }}>
              <div style={{ padding:"16px 18px", borderRadius:10, background:dark?"rgba(16,185,129,0.07)":"rgba(16,185,129,0.06)", border:`1px solid rgba(16,185,129,0.25)`, display:"flex", flexDirection:"column", gap:8 }}>
                <div style={{ fontSize:11, color:"#059669", letterSpacing:"0.1em", fontWeight:700 }}>BASE LICENCE REQUIRED</div>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <span style={{ fontSize:18, fontWeight:700, color:"#059669", fontFamily:CAL }}>M365 E3</span>
                  <span style={{ fontSize:13, color:t.text3, fontFamily:CAL }}>or equivalent</span>
                </div>
                <p style={{ fontSize:14, color:t.text3, margin:0, lineHeight:1.5, fontFamily:CAL }}>Covers core DLP on Exchange, SharePoint and OneDrive, manual sensitivity labelling, and basic policy enforcement across all standard workloads.</p>
              </div>
              <div style={{ padding:"16px 18px", borderRadius:10, background:phase.license.addOn?`rgba(217,134,28,0.08)`:`rgba(16,185,129,0.06)`, border:`1px solid ${phase.license.addOn?"rgba(217,134,28,0.3)":"rgba(16,185,129,0.25)"}` }}>
                <div style={{ fontSize:11, color:phase.license.addOn?BUI_ORANGE:"#059669", letterSpacing:"0.1em", fontWeight:700, marginBottom:8 }}>{phase.license.addOn?"ADD-ON REQUIRED":"NO ADD-ON REQUIRED"}</div>
                {phase.license.addOn ? (
                  <>
                    <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
                      <span style={{ fontSize:11, fontWeight:700, color:BUI_ORANGE, fontFamily:CAL }}>Microsoft Purview Suite</span>
                    </div>
                    <p style={{ fontSize:12, color:t.text4, margin:"0 0 4px", lineHeight:1.4, fontFamily:CAL }}>(formerly M365 E5 Compliance add-on, renamed October 2025)</p>
                  </>
                ) : (
                  <p style={{ fontSize:14, color:t.text3, margin:0, lineHeight:1.5, fontFamily:CAL }}>All capabilities in this phase are covered by M365 E3. No additional Purview licensing is required.</p>
                )}
              </div>
            </div>

            {phase.license.addOn && phase.license.addOnFeatures.length > 0 && (
              <div style={{ marginBottom:18 }}>
                <div style={{ fontSize:11, color:t.text5, letterSpacing:"0.09em", fontWeight:700, marginBottom:10 }}>FEATURES REQUIRING THE PURVIEW SUITE ADD-ON AT THIS PHASE</div>
                <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
                  {phase.license.addOnFeatures.map((f,i) => (
                    <div key={i} style={{ display:"flex", alignItems:"flex-start", gap:10, padding:"9px 12px", background:t.cmItem, borderRadius:8, border:`1px solid ${t.cmItemBorder}` }}>
                      <div style={{ width:8, height:8, borderRadius:"50%", background:BUI_ORANGE, flexShrink:0, marginTop:5 }}/>
                      <span style={{ fontSize:14, color:t.text2, lineHeight:1.5, fontFamily:CAL }}>{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ padding:"14px 18px", borderRadius:10, background:dark?`${BUI_ORANGE}09`:`${BUI_ORANGE}0d`, border:`1px solid ${BUI_ORANGE}28`, borderLeft:`3px solid ${BUI_ORANGE}` }}>
              <div style={{ fontSize:13, color:BUI_ORANGE, letterSpacing:"0.1em", fontWeight:700, marginBottom:7 }}>LICENSING NOTE</div>
              <p style={{ fontSize:14, color:t.text3, margin:0, lineHeight:1.65, fontFamily:CAL }}>{phase.license.note}</p>
            </div>

            <div style={{ marginTop:14, padding:"12px 16px", borderRadius:10, background:t.bgCard, border:`1px solid ${t.border}`, fontSize:14, color:t.text4, lineHeight:1.55, fontFamily:CAL }}>
              <span style={{ fontWeight:700, color:t.text3 }}>Important: </span>
              Licensing requirements apply per user. Every user whose content is inspected or who applies, views, or receives the benefit of a policy must hold the appropriate licence. Consult Microsoft's current Purview service description or your Microsoft licensing contact for the latest guidance — licensing terms change and this guidance reflects the position as of early 2025.
            </div>
          </div>
        )}

        {/* Configuration */}
        {tab==="configuration" && (
          <div>
            <div style={{ background:t.bgCard, border:`1px solid ${t.border}`, borderRadius:12, overflow:"hidden", marginBottom:14, boxShadow:t.shadow }}>
              <div style={{ padding:"11px 20px", background:dark?"rgba(255,255,255,0.025)":"rgba(0,0,0,0.02)", borderBottom:`1px solid ${t.border}`, display:"flex", justifyContent:"space-between", fontSize:13, color:t.text5, letterSpacing:"0.1em", fontWeight:700 }}>
                <span>SETTING</span><span>VALUE</span>
              </div>
              {phase.config.map(([k,v,type],i)=>{
                const s = badgeStyles[type]||badgeStyles.neutral;
                return (
                  <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"13px 20px", borderBottom:i<phase.config.length-1?`1px solid ${t.borderSub}`:"none", background:i%2===1?t.bgStripe:"transparent" }}>
                    <span style={{ fontSize:13, color:t.text3, fontFamily:CAL }}>{k}</span>
                    <span style={{ fontSize:13, padding:"4px 12px", borderRadius:6, background:s.bg, color:s.color, border:`1px solid ${s.border}`, fontFamily:CAL, fontWeight:600 }}>{v}</span>
                  </div>
                );
              })}
            </div>
            <div style={{ padding:"12px 16px", background:`${BUI_ORANGE}08`, border:`1px solid ${BUI_ORANGE}22`, borderRadius:10, fontSize:13, color:t.noteText, fontFamily:CAL, lineHeight:1.55 }}>
              <span style={{ color:BUI_ORANGE, fontWeight:700 }}>NOTE: </span>
              Configuration shown represents the recommended settings for this maturity phase. Adapt to your organisation's risk appetite and data classification taxonomy.
            </div>
          </div>
        )}

        {/* Outcomes */}
        {tab==="outcomes" && (
          <div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:18 }}>
              {phase.outcomes.map((o,i)=>(
                <div key={i} style={{ padding:"15px 18px", borderRadius:10, background:dark?`${phase.color}08`:`${phase.color}09`, border:`1px solid ${phase.color}22`, display:"flex", alignItems:"flex-start", gap:11, boxShadow:t.shadow }}>
                  <div style={{ width:8, height:8, borderRadius:"50%", background:phase.color, flexShrink:0, marginTop:5 }}/>
                  <span style={{ fontSize:13, color:t.text2, fontFamily:CAL, lineHeight:1.4 }}>{o}</span>
                </div>
              ))}
            </div>
            <div style={{ padding:"16px 20px", background:t.bgCard, border:`1px solid ${t.border}`, borderRadius:10, boxShadow:t.shadow }}>
              <div style={{ fontSize:13, color:phase.zoneColor, letterSpacing:"0.1em", fontWeight:700, marginBottom:8 }}>{phase.zone} ZONE — OBJECTIVE</div>
              <p style={{ fontSize:13, color:t.text3, margin:0, fontFamily:CAL, lineHeight:1.65 }}>{phase.zoneDesc}</p>
            </div>
          </div>
        )}

        {/* Nav */}
        <div style={{ display:"flex", justifyContent:"space-between", marginTop:36, paddingTop:20, borderTop:`1px solid ${t.border}` }}>
          <button onClick={()=>nav(-1)} disabled={active===0} style={{ padding:"10px 22px", fontSize:13, borderRadius:8, fontFamily:CAL, border:`1px solid ${t.border}`, background:"transparent", color:active===0?t.textMuted:t.text3, cursor:active===0?"not-allowed":"pointer", letterSpacing:"0.06em", fontWeight:600, transition:"all 0.14s" }}>← PREVIOUS</button>
          <div style={{ display:"flex", gap:6, alignSelf:"center" }}>
            {phases.map((_,i)=>(
              <div key={i} onClick={()=>{setActive(i);setTab("overview");}} style={{ width:i===active?20:6, height:6, borderRadius:3, background:i===active?BUI_ORANGE:t.pipEmpty, cursor:"pointer", transition:"all 0.2s" }}/>
            ))}
          </div>
          <button onClick={()=>nav(1)} disabled={active===total-1} style={{ padding:"10px 22px", fontSize:13, borderRadius:8, fontFamily:CAL, border:`1px solid ${active===total-1?t.border:BUI_ORANGE+"55"}`, background:active===total-1?"transparent":`${BUI_ORANGE}18`, color:active===total-1?t.textMuted:BUI_ORANGE, cursor:active===total-1?"not-allowed":"pointer", letterSpacing:"0.06em", fontWeight:700, transition:"all 0.14s" }}>NEXT →</button>
        </div>

        <div style={{ marginTop:32, paddingTop:14, borderTop:`1px solid ${t.borderSub}`, display:"flex", justifyContent:"space-between" }}>
          <span style={{ fontSize:13, color:t.textMuted, letterSpacing:"0.06em" }}>BUI · INNOVATION™ DELIVERY RESULTS</span>
          <span style={{ fontSize:13, color:t.textMuted }}>Microsoft Purview Maturity Framework</span>
        </div>
      </main>
    </div>
  );
}

// ── APP ROOT ──────────────────────────────────────────────────────────────────
export default function App() {
  const [view,       setView]       = useState("roadmap"); // "roadmap" | "dlp" | "labels"
  const [dark,       setDark]       = useState(true);
  const [dlpActive,  setDlpActive]  = useState(0);
  const [labelActive,setLabelActive]= useState(0);
  const [dlpTab,     setDlpTab]     = useState("overview");
  const [labelTab,   setLabelTab]   = useState("overview");

  const t = useMemo(()=>makeTheme(dark),[dark]);

  const navItems = [
    { id:"roadmap", label:"Roadmap"            },
    { id:"dlp",     label:"DLP Policies"        },
    { id:"labels",  label:"Sensitivity Labels" },
  ];

  return (
    <div style={{ minHeight:"100vh", background:t.bg, fontFamily:CAL, color:t.text1, display:"flex", flexDirection:"column", transition:"background 0.25s, color 0.25s" }}>

      {/* ── HEADER ── */}
      <header style={{ height:62, padding:"0 24px", flexShrink:0, background:t.bgHeader, borderBottom:`1px solid ${t.border}`, display:"flex", alignItems:"center", justifyContent:"space-between", boxShadow:t.shadow, transition:"background 0.25s" }}>
        <div style={{ display:"flex", alignItems:"center", gap:16 }}>
          {/* BUI wordmark */}
          <div style={{ display:"flex", alignItems:"center" }}>
            {["B","U","I"].map((l,i)=>(
              <div key={l} style={{ display:"flex", alignItems:"center" }}>
                <span style={{ fontSize:26, fontWeight:800, color:BUI_ORANGE, letterSpacing:"-0.02em", lineHeight:1, fontFamily:CAL }}>{l}</span>
                {i<2 && <div style={{ width:2, height:22, background:BUI_GRAY, margin:"0 4px" }}/>}
              </div>
            ))}
            <div style={{ marginLeft:11, lineHeight:1.35 }}>
              {["INNOVATION™","DELIVERY","RESULTS"].map(txt=>(
                <div key={txt} style={{ fontSize:13, color:BUI_GRAY, letterSpacing:"0.12em" }}>{txt}</div>
              ))}
            </div>
          </div>
          <div style={{ width:1, height:26, background:t.border }}/>
          <div>
            <div style={{ fontSize:11, fontWeight:700, color:t.text1 }}>Microsoft Purview</div>
            <div style={{ fontSize:13, color:BUI_GRAY, letterSpacing:"0.08em" }}>{view==="roadmap"?"ADOPTION ROADMAP":"MATURITY FRAMEWORK"}</div>
          </div>
          <div style={{ width:1, height:26, background:t.border }}/>
          {/* Track switcher */}
          <nav style={{ display:"flex", gap:2 }}>
            {navItems.map(n=>(
              <button key={n.id} onClick={()=>setView(n.id)} style={{ padding:"6px 18px", fontSize:15, borderRadius:8, border:"none", cursor:"pointer", background: view===n.id?`${BUI_ORANGE}18`:"transparent", color: view===n.id?BUI_ORANGE:t.text4, fontFamily:CAL, fontWeight: view===n.id?700:400, transition:"all 0.14s", borderBottom: view===n.id?`2px solid ${BUI_ORANGE}`:"2px solid transparent" }}>{n.label}</button>
            ))}
          </nav>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          {zones.map(z=>(
            <div key={z.name} style={{ fontSize:12, padding:"3px 10px", borderRadius:99, border:`1px solid ${z.color}35`, color:z.color, background:`${z.color}0d`, letterSpacing:"0.1em", fontWeight:700 }}>{z.name}</div>
          ))}
          <div style={{ width:1, height:22, background:t.border, margin:"0 4px" }}/>
          <ThemeToggle dark={dark} onToggle={()=>setDark(d=>!d)} t={t}/>
        </div>
      </header>

      {/* ── BODY ── */}
      <div style={{ display:"flex", flex:1, overflow:"hidden" }}>
        {view==="roadmap" && (
          <RoadmapView
            dark={dark} t={t}
            dlpActive={dlpActive} setDlpActive={setDlpActive} setDlpTab={setDlpTab}
            labelActive={labelActive} setLabelActive={setLabelActive} setLabelTab={setLabelTab}
            setView={setView}
          />
        )}
        {view==="dlp" && (
          <TrackDetailView
            phases={dlpPhases} active={dlpActive} setActive={setDlpActive}
            tab={dlpTab} setTab={setDlpTab} dark={dark} t={t}
          />
        )}
        {view==="labels" && (
          <TrackDetailView
            phases={labelPhases} active={labelActive} setActive={setLabelActive}
            tab={labelTab} setTab={setLabelTab} dark={dark} t={t}
          />
        )}
      </div>
    </div>
  );
}
