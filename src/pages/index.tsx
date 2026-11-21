import { Link } from 'react-router-dom'
import {
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
  Users,
  FileCheck2,
  LockKeyhole,
} from 'lucide-react'
import { Seo } from '../components/Seo'
import { seo } from '../seo'
import { REQUIRED_GATES } from '../lib/release-rules'

export default function Landing() {
  return (
    <>
      <Seo {...seo} path="/" />
      <div data-testid="static-landing" className="lp-landing">
        <nav className="lp-landing-nav">
          <span className="lp-brand">
            <ShieldCheck size={25} />
            LaunchProof
          </span>
          <span className="lp-eyebrow">
            EVIDENCE. COLLABORATION. ACCOUNTABILITY.
          </span>
          <Link className="lp-button lp-secondary" to="/home">
            Sign in <ArrowUpRight size={15} />
          </Link>
        </nav>
        <main className="lp-hero">
          <section>
            <p className="lp-eyebrow">YOUR TEAM'S RELEASE WORKSPACE</p>
            <h1>
              A clear decision.
              <br />
              <span>A confident release.</span>
            </h1>
            <p className="lp-lede">
              Bring evidence, independent review, and release sign-off into one
              shared workspace. Know what was checked, who checked it, and why
              you shipped.
            </p>
            <Link className="lp-button" to="/home">
              Open workspace <ArrowUpRight size={17} />
            </Link>
            <p className="lp-note">
              Five focused gates. One record your team can refer back to.
            </p>
          </section>
          <section
            className="lp-preview"
            aria-label="Illustrative release preview"
          >
            <div className="lp-preview-header">
              <span className="lp-eyebrow">RELEASE WORKSPACE</span>
              <span className="lp-badge">Illustrative preview</span>
            </div>
            <div className="lp-preview-title">
              <h2>
                Atlas API <span className="lp-badge">v2.4.0</span>
              </h2>
              <p>Production release policy · 5 required gates</p>
            </div>
            {REQUIRED_GATES.map((gate, index) => (
              <div className="lp-preview-row" key={gate.key}>
                <span>0{index + 1}</span>
                <strong>{gate.title}</strong>
                <CheckCircle2 size={17} />
              </div>
            ))}
            <footer>
              Evidence + an independent reviewer → an informed sign-off
            </footer>
          </section>
        </main>
        <div className="lp-benefits">
          <section>
            <FileCheck2 size={22} />
            <h2>Keep the evidence together</h2>
            <p>
              Attach what you checked and supporting links. Every attestation
              records its author and time.
            </p>
          </section>
          <section>
            <Users size={22} />
            <h2>Make review a team effort</h2>
            <p>
              Work live with invited reviewers. At least one independent
              attestation is required to approve.
            </p>
          </section>
          <section>
            <LockKeyhole size={22} />
            <h2>Preserve the decision</h2>
            <p>
              Save the evidence considered at sign-off. Download or print the
              final report for your records.
            </p>
          </section>
        </div>
        <footer className="lp-landing-footer">
          <span>LaunchProof · Verify together. Ship with confidence.</span>
          <span>Human attestation, not independent test certification.</span>
        </footer>
      </div>
    </>
  )
}
