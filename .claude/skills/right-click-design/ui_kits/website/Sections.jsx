/* global React */
const PILLARS = [
  ["server-cog", "Managed IT", "The day-to-day foundation that keeps your business running and protected, with proactive support, 24/7 helpdesk, and vCTO strategy.", "Fully Managed or Co-Managed"],
  ["shield-check", "Cybersecurity", "EDR/XDR with SOC-backed response, email & identity security, dark-web monitoring, and tested backup & disaster recovery.", "Built into everything"],
  ["clipboard-check", "Managed Compliance", "Audit-ready programs with a dedicated CMMC Level 2 practice for A&D, plus HIPAA & BAA for healthcare.", "CMMC L2 · HIPAA"],
  ["sparkles", "AI Consulting & Transformation", "Practical AI that automates real work: custom solutions, agent deployment, and governance guardrails.", "12-Month AI Program"],
];

function Services({ onPick }) {
  window.useLucide();
  const Icon = window.Icon;
  return (
    <section className="rc-section" id="services">
      <div className="rc-container">
        <div className="rc-section-head">
          <h2>What we do: Managed IT, cybersecurity, compliance, and AI</h2>
          <p className="rc-body-lg">Four practices, one accountable team, so there are no gaps between vendors and no "that's not in our scope."</p>
        </div>
        <div className="rc-grid-4">
          {PILLARS.map(([ic, t, d, tag]) => (
            <button className="rc-service" key={t} onClick={() => onPick && onPick(t)}>
              <span className="rc-service-tile"><Icon name={ic} size={24} /></span>
              <h4>{t}</h4>
              <p>{d}</p>
              <span className="rc-service-tag">{tag}</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

const SQUAD = [
  ["user-round-cog", "Squad Leader", "Your relationship owner and point of escalation. Owns roadmapping, Quarterly Business Reviews, and budget planning."],
  ["headset", "Helpdesk Engineers", "Your dedicated remote support team. Tickets and day-to-day requests handled by people who already know your environment."],
  ["wrench", "Onsite Engineers", "Hands-on support when you need a physical presence: deskside visits, hardware installs, and network work."],
];
const DEPTH = [
  ["arrow-up-right", "Escalation Squad"],
  ["clock", "24/7 TAC"],
  ["layers-3", "PSG"],
  ["truck", "Logistics Team"],
];

function Squad() {
  window.useLucide();
  const Icon = window.Icon;
  return (
    <section className="rc-section rc-section-tint" id="squad">
      <div className="rc-container">
        <div className="rc-section-head">
          <h2>How we're different: one dedicated Squad, always yours</h2>
          <p className="rc-body-lg">Most IT companies route your call to whoever's available. We assign you a <span className="rc-hl">Dedicated Squad</span>, a small team that knows your environment, your people, and your priorities. No re-explaining your setup to a stranger.</p>
        </div>
        <div className="rc-grid-3">
          {SQUAD.map(([ic, t, d]) => (
            <div className="rc-service" key={t} style={{ cursor: "default" }}>
              <span className="rc-service-tile"><Icon name={ic} size={24} /></span>
              <h4>{t}</h4>
              <p>{d}</p>
            </div>
          ))}
        </div>
        <div className="rc-depth">
          <span className="rc-depth-label">Backed by the full org</span>
          <div className="rc-depth-chips">
            {DEPTH.map(([ic, t]) => (
              <span className="rc-depth-chip" key={t}><Icon name={ic} size={16} /> {t}</span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

const INDUSTRIES = [
  ["building-2", "Architecture & Engineering", "Revit, AutoCAD & BIM workflows, large-file infrastructure, and multi-site connectivity, fully supported."],
  ["heart-pulse", "Healthcare", "HIPAA, PHI, and signed BAAs. Privacy-by-design with the controls patient data requires."],
  ["badge-check", "Aerospace & Defense", "A dedicated CMMC Level 2 program covering DFARS, CUI scoping, SSP/POA&M, and C3PAO-ready evidence."],
];

function Industries() {
  window.useLucide();
  const Icon = window.Icon;
  return (
    <section className="rc-section" id="industries">
      <div className="rc-container">
        <div className="rc-section-head">
          <h2>Industry fluency: we don't do generic IT</h2>
          <p className="rc-body-lg">Deepest in the three most demanding verticals, and we serve growing companies across many industries.</p>
        </div>
        <div className="rc-grid-3">
          {INDUSTRIES.map(([ic, t, d]) => (
            <div className="rc-industry" key={t}>
              <span className="rc-industry-ic"><Icon name={ic} size={22} /></span>
              <div>
                <h4>{t}</h4>
                <p>{d}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Stats() {
  const STATS = [["250+", "Clients supported"], ["1997", "Independent, same leadership"], [">98%", "EDR coverage"], ["4.8/5", "Average CSAT"]];
  return (
    <section className="rc-stats">
      <div className="rc-container rc-stats-inner">
        {STATS.map(([n, l]) => (
          <div className="rc-stat" key={l}>
            <b>{n}</b>
            <span className="rc-stat-underline"></span>
            <span className="rc-stat-label">{l}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

const STEPS = [
  ["search", "Discovery Call", "We listen first: your environment, frustrations, goals, and compliance needs. A real conversation, never a checklist."],
  ["clipboard-list", "Assessment & Proposal", "A tailored plan: what we found, what we recommend, what it costs. No surprises."],
  ["file-signature", "Agreement", "Scope, pricing, and terms finalized. Simple and transparent, with no pressure to sign on the spot."],
  ["users", "Kickoff Meeting", "You meet your Squad by name. We align on priorities, communication, and Day 1 actions."],
  ["rocket", "You're Onboarded", "Monitoring is live, helpdesk is active, and your Squad is already working, typically 2-4 weeks in."],
];

function Process() {
  window.useLucide();
  const Icon = window.Icon;
  return (
    <section className="rc-section rc-section-tint" id="process">
      <div className="rc-container">
        <div className="rc-section-head">
          <h2>Our process, from first call to onboarded in 2–4 weeks</h2>
          <p className="rc-body-lg">Five steps, no ambiguity, and a clear path forward at every stage.</p>
        </div>
        <div className="rc-steps">
          {STEPS.map(([ic, t, d], i) => (
            <div className="rc-step" key={t}>
              <span className="rc-step-num">{String(i + 1).padStart(2, "0")}</span>
              <span className="rc-step-ic"><Icon name={ic} size={20} /></span>
              <h4>{t}</h4>
              <p>{d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Testimonial() {
  window.useLucide();
  const Icon = window.Icon;
  return (
    <section className="rc-section rc-section-navy" id="about">
      <div className="rc-container rc-quote">
        <Icon name="quote" size={40} cls="rc-quote-mark" />
        <blockquote>
          I can make a map before the old app would even open.
        </blockquote>
        <p className="rc-quote-sub">When a critical mapping workflow was being discontinued, we built a custom AI replacement from scratch, cutting a report from <span className="rc-hl">1 to 2 hours down to 5 to 15 minutes</span>.</p>
        <div className="rc-quote-by">
          <span className="rc-quote-client">Featured client</span>          <span className="rc-quote-logo"><img src={(window.__resources && window.__resources.concordLogo) || "../../assets/concord-group.png"} alt="The Concord Group" /></span>
        </div>
      </div>
    </section>
  );
}

window.Services = Services;
window.Squad = Squad;
window.Industries = Industries;
window.Stats = Stats;
window.Process = Process;
window.Testimonial = Testimonial;
