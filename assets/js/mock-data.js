/* CoverMe — MOCK reference data for the template.
   In production these come from the API (GET /hmos, GET /drugs, GET /rules), which
   is seeded from coverme_seed.zip (nhia_hmos.json, nhia_drugs.json,
   nhia_drug_list_gaps.json, coverme_rules.json).
   Phone numbers below are PLACEHOLDERS, not real HMO numbers. Rule texts are
   illustrative stand-ins until the 32 sourced rules are loaded. */
window.CM = window.CM || {};
CM.mock = (function () {
  const hmos = [
    ['h01', 'Hygeia HMO', true], ['h02', 'AXA Mansard Health', true], ['h03', 'Reliance HMO', true],
    ['h04', 'Leadway Health', true], ['h05', 'Avon HMO', true], ['h06', 'Police HMO', true],
    ['h07', 'Clearline HMO', false], ['h08', 'Total Health Trust', false], ['h09', 'Hallmark HMO', false],
    ['h10', 'Wellness HMO', false], ['h11', 'Novo Health Africa', false], ['h12', 'Ronsberger HMO', false],
    ['h13', 'Redcare HMO', false], ['h14', 'Princeton HMO', false], ['h15', 'United Healthcare International', false],
    ['h16', 'Integrated Healthcare', false], ['h17', 'Metrohealth HMO', false], ['h18', 'Precious HMO', false],
    ['h19', 'Songhai HMO', false], ['h20', 'Sterling Health HMO', false], ['h21', 'Defence HMO', false],
    ['h22', 'Prohealth HMO', false], ['h23', 'Venus Medicare', false], ['h24', 'Zuma Health Trust', false]
  ].map(function (r, i) {
    const n = String(101 + i);
    return { id: r[0], name: r[1], popular: r[2], nhiaCode: 'NHIA/HMO/' + n, phone: '0700 000 0' + n, phoneTel: '+2347000000' + n, email: 'care@example-hmo' + n + '.ng' };
  });

  /* A small sample of the 1,025-drug NHIA list */
  const drugs = [
    'Amoxicillin', 'Amoxicillin + Clavulanic acid', 'Paracetamol', 'Ibuprofen', 'Metronidazole', 'Ciprofloxacin',
    'Artemether + Lumefantrine', 'Artesunate', 'Ceftriaxone', 'Metformin', 'Amlodipine', 'Lisinopril',
    'Insulin (soluble)', 'Salbutamol', 'Omeprazole', 'Oral rehydration salts', 'Zinc sulphate', 'Ferrous sulphate',
    'Folic acid', 'Oxytocin', 'Magnesium sulphate', 'Diazepam', 'Hydrocortisone', 'Gentamicin', 'Cotrimoxazole',
    'Chloroquine', 'Prednisolone', 'Losartan', 'Nifedipine', 'Azithromycin'
  ].map(function (n, i) { return { id: 'd' + (i + 1), nhiaCode: 'NHIA/DRG/' + (1000 + i), name: n }; });

  /* Drug codes with gaps in the published list: a near-miss here means "confirm with HMO" */
  const drugGaps = [{ nhiaCode: 'NHIA/DRG/2040-2089', rangeNote: 'Oncology codes not published in current list' }];

  const SRC = 'https://www.nhia.gov.ng/';
  const rules = [
    { id: 'R01', topic: 'drugs', issueType: 'drug_not_covered', confidence: 'high',
      title: { en: 'Drugs on the NHIA list come from the facility', pcm: 'Drug wey dey NHIA list, na hospital go give am' },
      says: { en: 'If a drug is on the NHIA medicines list for your plan, the accredited facility should supply it. You should not be sent to buy it outside.', pcm: 'If drug dey NHIA medicine list for your plan, the hospital suppose give you am. Dem no suppose send you go buy am outside.' } },
    { id: 'R02', topic: 'drugs', issueType: 'drug_not_covered', confidence: 'low',
      title: { en: 'Drugs not found on the list', pcm: 'Drug wey we no see for list' },
      says: { en: 'A drug missing from the published NHIA list is not automatically excluded. Ask your HMO to confirm before paying.', pcm: 'If drug no dey the NHIA list, e no mean say dem no go cover am. Ask your HMO make dem confirm before you pay.' } },
    { id: 'R03', topic: 'payments', issueType: 'cash_demanded', confidence: 'high',
      title: { en: 'No cash for covered services', pcm: 'No cash for service wey dey covered' },
      says: { en: 'For services covered by your plan, the facility should bill your HMO, not ask you for cash at the point of care.', pcm: 'For service wey your plan cover, hospital suppose bill your HMO, no be to collect cash from you.' } },
    { id: 'R04', topic: 'payments', issueType: 'cash_demanded', confidence: 'high',
      title: { en: 'Ask for a receipt for any payment', pcm: 'Collect receipt for any money you pay' },
      says: { en: 'If you pay anything, ask for an itemised receipt. You need it to claim a refund through your HMO or NHIA.', pcm: 'If you pay anything, collect receipt wey show everything. You go need am to collect refund through your HMO or NHIA.' } },
    { id: 'R05', topic: 'payments', issueType: 'drug_not_covered', confidence: 'high', hmoOnly: 'h06',
      title: { en: 'Police HMO: 10% drug co-payment', pcm: 'Police HMO: 10% drug co-pay' },
      says: { en: 'Under this HMO’s plan, enrollees pay 10% of the cost of drugs. The facility may ask you for this share only.', pcm: 'For this HMO plan, enrollee go pay 10% of drug money. Hospital fit ask you for only that 10%.' } },
    { id: 'R07', topic: 'access', issueType: 'auth_delay', confidence: 'high', title: { en: 'NHIA Enrollee Charter', pcm: 'NHIA Enrollee Charter' },
      says: { en: 'Your HMO must give the authorisation (approval) code within 1 hour of the hospital’s request.', pcm: 'Your HMO suppose give approval code inside 1 hour after hospital request am.' } },
    { id: 'R08', topic: 'referrals', issueType: 'referral_delay', confidence: 'high',
      title: { en: 'Referral approval within 1 hour', pcm: 'Referral approval inside 1 hour' },
      says: { en: 'When your doctor refers you to another facility, your HMO should issue the referral code within 1 hour.', pcm: 'When doctor refer you go another hospital, your HMO suppose give referral code inside 1 hour.' } },
    { id: 'R09', topic: 'referrals', issueType: 'referral_delay', confidence: 'low',
      title: { en: 'Choice of referral facility', pcm: 'Which hospital dem go refer you' },
      says: { en: 'Referrals usually go to a facility in your HMO’s network. Ask your HMO which ones are approved near you.', pcm: 'Referral dey usually go hospital wey dey your HMO network. Ask your HMO which one dem approve near you.' } },
    { id: 'R10', topic: 'emergencies', issueType: 'other', confidence: 'high',
      title: { en: 'Emergency care comes first', pcm: 'Emergency treatment first' },
      says: { en: 'In an emergency, get treated at the nearest hospital. Authorisation can be sorted out after the patient is stable.', pcm: 'For emergency, go collect treatment for the nearest hospital. Approval matter fit wait till the patient don stable.' } },
    { id: 'R11', topic: 'access', issueType: 'other', confidence: 'high',
      title: { en: 'You can complain to NHIA', pcm: 'You fit complain to NHIA' },
      says: { en: 'If your HMO does not resolve your complaint, you can take it to NHIA’s call centre, and then to NHIA Enforcement.', pcm: 'If your HMO no settle your complaint, you fit carry am go NHIA call centre, then NHIA Enforcement.' } },
    { id: 'R12', topic: 'access', issueType: 'other', confidence: 'high',
      title: { en: 'Right to information', pcm: 'Right to know' },
      says: { en: 'You have the right to know what your plan covers. Your HMO should explain your benefits when you ask.', pcm: 'You get right to know wetin your plan cover. Your HMO suppose explain am when you ask.' } },
    { id: 'R13', topic: 'payments', issueType: 'cash_demanded', confidence: 'low',
      title: { en: 'Deposits before treatment', pcm: 'Deposit before treatment' },
      says: { en: 'Facilities should not demand a deposit for services covered by your plan. If asked, call your HMO before paying.', pcm: 'Hospital no suppose collect deposit for service wey your plan cover. If dem ask, call your HMO before you pay.' } }
  ].map(function (r) { return Object.assign({ sourceUrl: SRC, sourceDate: '2024-06-01', sourceName: 'NHIA (placeholder source)' }, r); });

  const palette = ['#0B5D4B', '#12876B', '#7A4E16', '#4B5A9B', '#8A3B5E', '#2F6F8F', '#6B5B2E', '#5E6A65'];
  function colorFor(s) { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return palette[h % palette.length]; }
  function initials(name) { return name.replace(/\b(HMO|Health|Healthcare|Trust)\b/gi, '').trim().split(/\s+/).slice(0, 2).map(function (w) { return w[0]; }).join('').toUpperCase() || name.slice(0, 2).toUpperCase(); }

  return { hmos, drugs, drugGaps, rules, colorFor, initials };
})();
