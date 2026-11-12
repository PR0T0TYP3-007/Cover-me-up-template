/* CoverMe — MOCK reference data for the template.
   In production these come from the API (GET /hmos, /drugs, /rules, /facilities), seeded from
   coverme_seed.zip (nhia_hmos.json, nhia_drugs.json, nhia_drug_list_gaps.json, coverme_rules.json)
   and the federal Health Facility Registry (Anambra, Lagos, FCT for the prototype).
   Phone numbers and emails below are PLACEHOLDERS. Rule texts are illustrative stand-ins
   until the 32 sourced rules are loaded. Facility coordinates are approximate. */
window.CM = window.CM || {};
CM.mock = (function () {
  /* ---- HMOs (94 in the seed; a sample here). idFormat = known enrollee ID pattern, if any. ---- */
  const hmos = [
    ['h01', 'Hygeia HMO', true, /^HYG\/\d{6}$/, 'HYG/123456'],
    ['h02', 'AXA Mansard Health', true, null, null],
    ['h03', 'Reliance HMO', true, /^RHL\/\d{4}\/\d{4}$/, 'RHL/1234/5678'],
    ['h04', 'Leadway Health', true, null, null],
    ['h05', 'Avon HMO', true, null, null],
    ['h06', 'Police HMO', true, /^PHMO\d{7}$/, 'PHMO1234567'],
    ['h07', 'Clearline HMO', false], ['h08', 'Total Health Trust', false], ['h09', 'Hallmark HMO', false],
    ['h10', 'Wellness HMO', false], ['h11', 'Novo Health Africa', false], ['h12', 'Ronsberger HMO', false],
    ['h13', 'Redcare HMO', false], ['h14', 'Princeton HMO', false], ['h15', 'United Healthcare International', false],
    ['h16', 'Integrated Healthcare', false], ['h17', 'Metrohealth HMO', false], ['h18', 'Precious HMO', false],
    ['h19', 'Songhai HMO', false], ['h20', 'Sterling Health HMO', false], ['h21', 'Defence HMO', false],
    ['h22', 'Prohealth HMO', false], ['h23', 'Venus Medicare', false], ['h24', 'Zuma Health Trust', false]
  ].map(function (r, i) {
    const n = String(101 + i);
    return {
      id: r[0], name: r[1], popular: r[2], idFormat: r[3] || null, idExample: r[4] || null,
      nhiaCode: 'NHIA/HMO/' + n, phone: '0700 000 0' + n, phoneTel: '+2347000000' + n,
      complaintEmail: 'complaints@example-hmo' + n + '.ng'
    };
  });

  /* ---- Regulators. NHIA takes complaints by phone, email, letter, in person. ---- */
  const nhia = { id: 'nhia', name: 'NHIA', longName: 'National Health Insurance Authority', phone: '0700 000 0642', tel: '+2347000000642', email: 'complaints@example-nhia.gov.ng' };
  const stateAgencies = [
    { id: 'lashma', state: 'Lagos', name: 'LASHMA', longName: 'Lagos State Health Management Agency', phone: '0700 000 0201', tel: '+2347000000201', email: 'complaints@example-lashma.ng' },
    { id: 'ashia', state: 'Anambra', name: 'ASHIA', longName: 'Anambra State Health Insurance Agency', phone: '0700 000 0202', tel: '+2347000000202', email: 'complaints@example-ashia.ng' },
    { id: 'fhis', state: 'FCT', name: 'FHIS', longName: 'FCT Health Insurance Scheme', phone: '0700 000 0203', tel: '+2347000000203', email: 'complaints@example-fhis.ng' }
  ];

  /* ---- States + LGAs (prototype scope: Anambra, Lagos, FCT) ---- */
  const states = {
    Lagos: ['Alimosho', 'Eti-Osa', 'Ikeja', 'Ikorodu', 'Kosofe', 'Lagos Island', 'Mushin', 'Surulere'],
    FCT: ['Abuja Municipal (AMAC)', 'Bwari', 'Gwagwalada', 'Kuje'],
    Anambra: ['Awka South', 'Idemili North', 'Nnewi North', 'Onitsha North']
  };

  /* ---- Health facilities (Health Facility Registry sample). level feeds the rules engine. ---- */
  const facilities = [
    ['f01', 'Lagos State University Teaching Hospital (LASUTH)', 'Lagos', 'Ikeja', 'tertiary', 'public', 6.5966, 3.3515],
    ['f02', 'Lagos University Teaching Hospital (LUTH)', 'Lagos', 'Mushin', 'tertiary', 'public', 6.5180, 3.3560],
    ['f03', 'General Hospital, Lagos Island', 'Lagos', 'Lagos Island', 'secondary', 'public', 6.4520, 3.3920],
    ['f04', 'Gbagada General Hospital', 'Lagos', 'Kosofe', 'secondary', 'public', 6.5560, 3.3870],
    ['f05', 'Alimosho General Hospital, Igando', 'Lagos', 'Alimosho', 'secondary', 'public', 6.5530, 3.2450],
    ['f06', 'General Hospital, Ikorodu', 'Lagos', 'Ikorodu', 'secondary', 'public', 6.6190, 3.5100],
    ['f07', 'Primary Health Centre, Ikeja', 'Lagos', 'Ikeja', 'primary', 'public', 6.6010, 3.3490],
    ['f08', 'Reddington Hospital, Victoria Island', 'Lagos', 'Eti-Osa', 'secondary', 'private', 6.4300, 3.4210],
    ['f09', 'Primary Health Centre, Surulere', 'Lagos', 'Surulere', 'primary', 'public', 6.5000, 3.3540],
    ['f10', 'National Hospital Abuja', 'FCT', 'Abuja Municipal (AMAC)', 'tertiary', 'public', 9.0410, 7.4720],
    ['f11', 'Wuse District Hospital', 'FCT', 'Abuja Municipal (AMAC)', 'secondary', 'public', 9.0800, 7.4700],
    ['f12', 'Garki Hospital', 'FCT', 'Abuja Municipal (AMAC)', 'secondary', 'public', 9.0320, 7.4890],
    ['f13', 'University of Abuja Teaching Hospital', 'FCT', 'Gwagwalada', 'tertiary', 'public', 8.9440, 7.0800],
    ['f14', 'Kubwa General Hospital', 'FCT', 'Bwari', 'secondary', 'public', 9.1530, 7.3220],
    ['f15', 'Primary Health Centre, Kuje', 'FCT', 'Kuje', 'primary', 'public', 8.8790, 7.2270],
    ['f16', 'Chukwuemeka Odumegwu Ojukwu University Teaching Hospital, Awka', 'Anambra', 'Awka South', 'tertiary', 'public', 6.2100, 7.0700],
    ['f17', 'Nnamdi Azikiwe University Teaching Hospital, Nnewi', 'Anambra', 'Nnewi North', 'tertiary', 'public', 6.0200, 6.9100],
    ['f18', 'General Hospital, Onitsha', 'Anambra', 'Onitsha North', 'secondary', 'public', 6.1500, 6.7900],
    ['f19', 'Primary Health Centre, Awka', 'Anambra', 'Awka South', 'primary', 'public', 6.2200, 7.0800],
    ['f20', 'Iyi-Enu Mission Hospital, Ogidi', 'Anambra', 'Idemili North', 'secondary', 'private', 6.1600, 6.8700]
  ].map(function (r) { return { id: r[0], hfrId: 'HFR-' + r[0].toUpperCase(), name: r[1], state: r[2], lga: r[3], level: r[4], ownership: r[5], lat: r[6], lng: r[7] }; });

  /* ---- A sample of the 1,025-drug NHIA list. level = lowest level of care that can give it. ---- */
  const drugs = [
    ['Amoxicillin', 'primary'], ['Amoxicillin + Clavulanic acid', 'secondary'], ['Paracetamol', 'primary'], ['Ibuprofen', 'primary'],
    ['Metronidazole', 'primary'], ['Ciprofloxacin', 'primary'], ['Artemether + Lumefantrine', 'primary'], ['Artesunate', 'primary'],
    ['Ceftriaxone', 'secondary'], ['Metformin', 'primary'], ['Amlodipine', 'primary'], ['Lisinopril', 'primary'],
    ['Insulin (soluble)', 'secondary'], ['Salbutamol', 'primary'], ['Omeprazole', 'primary'], ['Oral rehydration salts', 'primary'],
    ['Zinc sulphate', 'primary'], ['Ferrous sulphate', 'primary'], ['Folic acid', 'primary'], ['Oxytocin', 'secondary'],
    ['Magnesium sulphate', 'secondary'], ['Diazepam', 'primary'], ['Hydrocortisone', 'secondary'], ['Gentamicin', 'secondary'],
    ['Cotrimoxazole', 'primary'], ['Chloroquine', 'primary'], ['Prednisolone', 'primary'], ['Losartan', 'primary'],
    ['Nifedipine', 'primary'], ['Azithromycin', 'primary'], ['Meropenem', 'tertiary']
  ].map(function (d, i) { return { id: 'd' + (i + 1), nhiaCode: 'NHIA/DRG/' + (1000 + i), name: d[0], level: d[1] }; });

  /* Drug codes with gaps in the published list: a near-miss here means "confirm with HMO" */
  const drugGaps = [{ nhiaCode: 'NHIA/DRG/2040-2089', rangeNote: 'Oncology codes not published in current list' }];

  /* ---- Rules. appliesTo: which plan groups (nhia / state / private). universal = applies to every plan. ---- */
  const SRC = 'https://www.nhia.gov.ng/';
  const NHIA = ['nhia'];
  const rules = [
    { id: 'R01', topic: 'drugs', issueType: 'drug_refused', confidence: 'high', appliesTo: NHIA,
      title: { en: 'Drugs on the NHIA list come from the facility', pcm: 'Drug wey dey NHIA list, na hospital go give am' },
      says: { en: 'If a drug is on the NHIA medicines list for your plan, the accredited facility should supply it. You should not be sent to buy it outside.', pcm: 'If drug dey NHIA medicine list for your plan, the hospital suppose give you am. Dem no suppose send you go buy am outside.' } },
    { id: 'R02', topic: 'drugs', issueType: 'drug_refused', confidence: 'low', appliesTo: NHIA,
      title: { en: 'Drugs not found on the list', pcm: 'Drug wey we no see for list' },
      says: { en: "A drug missing from NHIA's online list is not automatically excluded: the list has gaps. Ask your HMO to confirm before paying.", pcm: 'If drug no dey NHIA online list, e no mean say dem no go cover am, because the list get gap. Ask your HMO make dem confirm before you pay.' } },
    { id: 'R03', topic: 'payments', issueType: 'cash_demanded', confidence: 'high', appliesTo: NHIA,
      title: { en: 'No cash for covered services', pcm: 'No cash for service wey dey covered' },
      says: { en: 'For services covered by your plan, the facility should bill your HMO, not ask you for cash at the point of care.', pcm: 'For service wey your plan cover, hospital suppose bill your HMO, no be to collect cash from you.' } },
    { id: 'R04', topic: 'payments', issueType: 'cash_demanded', confidence: 'high', appliesTo: NHIA,
      title: { en: 'Ask for a receipt for any payment', pcm: 'Collect receipt for any money you pay' },
      says: { en: 'If you pay anything, ask for an itemised receipt. You need it to claim a refund through your HMO or NHIA.', pcm: 'If you pay anything, collect receipt wey show everything. You go need am to collect refund through your HMO or NHIA.' } },
    { id: 'R05', topic: 'payments', issueType: 'drug_refused', confidence: 'high', appliesTo: NHIA, hmoOnly: 'h06',
      title: { en: 'Police HMO: 10% drug co-payment', pcm: 'Police HMO: 10% drug co-pay' },
      says: { en: "Under this HMO's plan, enrollees pay 10% of the cost of drugs. The facility may ask you for this share only.", pcm: 'For this HMO plan, enrollee go pay 10% of drug money. Hospital fit ask you for only that 10%.' } },
    { id: 'R06', topic: 'payments', issueType: 'cash_demanded', confidence: 'low', appliesTo: NHIA,
      title: { en: 'Drug co-payments may apply', pcm: 'Co-pay for drug fit dey' },
      says: { en: 'Some NHIA programmes and HMOs ask enrollees to pay a small share of drug costs. Ask how much it is and what it is for before you pay.', pcm: 'Some NHIA programme and HMO dey ask enrollee to pay small part of drug money. Ask how much and wetin e be for before you pay.' } },
    { id: 'R07', topic: 'access', issueType: 'auth_delay', confidence: 'high', appliesTo: NHIA, title: { en: 'NHIA Enrollee Charter', pcm: 'NHIA Enrollee Charter' },
      says: { en: "Your HMO must give the authorisation (approval) code within 1 hour of the hospital's request.", pcm: 'Your HMO suppose give approval code inside 1 hour after hospital request am.' } },
    { id: 'R08', topic: 'referrals', issueType: 'referral_delay', confidence: 'high', appliesTo: NHIA,
      title: { en: 'Referral approval within 1 hour', pcm: 'Referral approval inside 1 hour' },
      says: { en: 'When your doctor refers you to another facility, your HMO should issue the referral code within 1 hour.', pcm: 'When doctor refer you go another hospital, your HMO suppose give referral code inside 1 hour.' } },
    { id: 'R09', topic: 'referrals', issueType: 'referral_delay', confidence: 'low', appliesTo: NHIA,
      title: { en: 'Choice of referral facility', pcm: 'Which hospital dem go refer you' },
      says: { en: "Referrals usually go to a facility in your HMO's network. Ask your HMO which ones are approved near you.", pcm: 'Referral dey usually go hospital wey dey your HMO network. Ask your HMO which one dem approve near you.' } },
    { id: 'R10', topic: 'emergencies', issueType: 'other', confidence: 'high', universal: true,
      title: { en: 'Emergency care comes first', pcm: 'Emergency treatment first' },
      says: { en: 'In an emergency, get treated at the nearest hospital. Authorisation can be sorted out after the patient is stable.', pcm: 'For emergency, go collect treatment for the nearest hospital. Approval matter fit wait till the patient don stable.' } },
    { id: 'R11', topic: 'access', issueType: 'other', confidence: 'high', universal: true,
      title: { en: 'You can complain', pcm: 'You fit complain' },
      says: { en: "If your HMO does not resolve your complaint, you can take it to the regulator: NHIA for NHIA programmes, or your state's health insurance agency for a state scheme.", pcm: 'If your HMO no settle your complaint, you fit carry am go regulator: NHIA for NHIA programme, or your state health insurance agency for state scheme.' } },
    { id: 'R12', topic: 'access', issueType: 'other', confidence: 'high', appliesTo: NHIA,
      title: { en: 'Right to information', pcm: 'Right to know' },
      says: { en: 'You have the right to know what your plan covers. Your HMO should explain your benefits when you ask.', pcm: 'You get right to know wetin your plan cover. Your HMO suppose explain am when you ask.' } },
    { id: 'R13', topic: 'payments', issueType: 'cash_demanded', confidence: 'low', appliesTo: NHIA,
      title: { en: 'Deposits before treatment', pcm: 'Deposit before treatment' },
      says: { en: 'Facilities should not demand a deposit for services covered by your plan. If asked, call your HMO before paying.', pcm: 'Hospital no suppose collect deposit for service wey your plan cover. If dem ask, call your HMO before you pay.' } },
    { id: 'R14', topic: 'referrals', issueType: 'drug_refused', confidence: 'high', appliesTo: NHIA,
      title: { en: 'Some care needs a higher level facility', pcm: 'Some treatment need bigger hospital' },
      says: { en: 'Some NHIA drugs and services are given only at secondary or tertiary facilities. A primary clinic should refer you, through your HMO, to one that can give it.', pcm: 'Some NHIA drug and service na only secondary or tertiary hospital dey give am. Small clinic suppose refer you, through your HMO, go hospital wey fit give am.' } }
  ].map(function (r) { return Object.assign({ sourceUrl: SRC, sourceDate: '2024-06-01', sourceName: 'NHIA (placeholder source)' }, r); });

  const palette = ['#0B5D4B', '#12876B', '#7A4E16', '#4B5A9B', '#8A3B5E', '#2F6F8F', '#6B5B2E', '#5E6A65'];
  function colorFor(s) { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return palette[h % palette.length]; }
  function initials(name) { return name.replace(/\b(HMO|Health|Healthcare|Trust)\b/gi, '').trim().split(/\s+/).slice(0, 2).map(function (w) { return w[0]; }).join('').toUpperCase() || name.slice(0, 2).toUpperCase(); }

  /* What the (mock) card scan "reads". Production: POST /me/card-scan → Gemini JSON, image discarded. */
  const cardScanResult = { hmoName: 'Reliance HMO', enrolleeId: 'RHL/2048/7731', memberName: 'Ada Okafor', planName: 'NHIA Formal Sector', expiry: '2027-03-31', primaryFacility: 'General Hospital, Lagos Island' };

  return { hmos, nhia, stateAgencies, states, facilities, drugs, drugGaps, rules, colorFor, initials, cardScanResult };
})();
