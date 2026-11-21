import { Link } from 'react-router-dom'
import { ArrowUpRight, ShieldCheck, Check } from 'lucide-react'
import { Seo } from '../components/Seo'
import { seo } from '../seo'
import { REQUIRED_GATES } from '../lib/release-rules'

export default function Landing() {
  return <><Seo {...seo} path="/" /><div data-testid="static-landing" className="lp-landing">
    <nav className="lp-landing-nav"><span><ShieldCheck size={24} />LaunchProof</span><span className="lp-eyebrow">A SHARED STANDARD FOR SHIPPING</span></nav>
    <main className="lp-hero"><section><p className="lp-eyebrow">EVIDENCE FIRST. RELEASE SECOND.</p><h1>Verify together.<br /><em>Ship with confidence.</em></h1><p className="lp-lede">Turn “are we ready?” into a decision your team can stand behind. Five clear checks, shared evidence, and one lasting release record.</p><Link className="lp-button" to="/home">Open workspace <ArrowUpRight size={19} /></Link><p className="lp-note">Human verification. Clear accountability.</p></section>
    <section className="lp-preview" aria-label="Workflow preview"><div className="lp-preview-header"><p className="lp-eyebrow">THE RELEASE CHECKLIST</p><ShieldCheck size={24} /></div>{REQUIRED_GATES.map((gate, index) => <div className="lp-preview-row" key={gate.key}><span>0{index + 1}</span><strong>{gate.title}</strong><Check size={18} /></div>)}<footer>Collect evidence → Review together → Save the decision</footer></section></main>
    <footer className="lp-landing-footer"><span>LaunchProof</span><span>Five gates. One considered decision.</span></footer>
  </div></>
}
