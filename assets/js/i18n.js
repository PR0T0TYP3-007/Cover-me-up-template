/* CoverMe — bilingual strings (English + Nigerian Pidgin).
   Every UI string lives here. In HTML:
     <span data-i18n="home.voice.title"></span>
     <input data-i18n-attr="placeholder:home.text.placeholder;aria-label:home.text.label">
   In JS: CM.t('timer.overdue', { m: 12 }) */
window.CM = window.CM || {};
(function () {
  const S = {
    en: {
      'app.name': 'CoverMe',
      'nav.home': 'Home', 'nav.cases': 'My cases', 'nav.rights': 'Rights', 'nav.settings': 'Settings',
      'common.back': 'Back', 'common.close': 'Close', 'common.cancel': 'Cancel', 'common.continue': 'Continue',
      'common.skip': 'Skip', 'common.done': 'Done', 'common.save': 'Save', 'common.edit': 'Edit',
      'common.copy': 'Copy', 'common.copied': 'Copied', 'common.seeAll': 'See all', 'common.emergency': 'Emergency help',
      'lang.switch': 'Language', 'lang.en': 'EN', 'lang.pcm': 'Pidgin',
      'offline.title': "You're offline.", 'offline.body': 'Your last script is saved below.',
      'offline.bodyGeneric': 'We’ll keep what you type and send it when you’re back online.',
      'error.title': "We couldn't check right now.", 'error.body': "Here is your HMO's number. Call them while we try again.",
      'error.retry': 'Try again', 'error.pick': 'Or pick what happened:',
      'time.justNow': 'just now', 'time.min': '{n} min ago', 'time.hour': '{n} h ago', 'time.day': '{n} d ago',

      'welcome.s1.title': 'Know your rights',
      'welcome.s1.body': 'Find out in one minute what your HMO must cover, with the NHIA rule to prove it.',
      'welcome.s2.title': 'Say the right thing',
      'welcome.s2.body': "Get a calm, polite script to show the hospital desk, and your HMO's number one tap away.",
      'welcome.s3.title': 'Complain in one tap',
      'welcome.s3.body': "If they keep you waiting, we time it and write your complaint to the HMO and NHIA.",
      'welcome.next': 'Next', 'welcome.start': 'Get started', 'welcome.slide': 'Slide {n} of 3',
      'consent.title': 'Before we start',
      'consent.l1': 'We only collect what we need to help you. No account, no diagnosis.',
      'consent.l2': "An AI (Google's Gemini) reads your message to understand it. Our rules, not the AI, decide what's covered.",
      'consent.l3': 'You can delete everything, any time, in one tap.',
      'consent.agree': 'I understand', 'consent.privacy': 'Read the privacy notice',
      'consent.notAdvice': 'CoverMe gives information about your rights, not medical advice.',

      'setup.title': 'Set up', 'setup.step': 'Step {n} of 3',
      'setup.hmo.title': 'Who is your HMO?', 'setup.hmo.hint': "It's on your HMO or NHIA card.",
      'setup.hmo.search': 'Search 94 HMOs', 'setup.hmo.recent': 'Recent', 'setup.hmo.popular': 'Popular',
      'setup.hmo.all': 'All HMOs', 'setup.hmo.none': 'No HMO matches “{q}”.', 'setup.hmo.notSure': "I don't know my HMO",
      'setup.plan.title': 'What kind of plan?', 'setup.plan.hint': 'This decides which rules apply to you.',
      'setup.plan.nhia': 'NHIA (formal sector)', 'setup.plan.nhia.sub': 'Through your employer or the federal government',
      'setup.plan.state': 'State health scheme', 'setup.plan.state.sub': 'For example LASHMA or KSCHMA',
      'setup.plan.private': 'Private plan', 'setup.plan.private.sub': 'You or your company bought it directly',
      'setup.plan.unsure': 'Not sure', 'setup.plan.unsure.sub': "We'll use the NHIA rules and tell you when to confirm",
      'setup.hosp.title': 'Which hospital are you at?', 'setup.hosp.hint': 'Optional. It goes into your complaint letter.',
      'setup.hosp.label': 'Hospital name', 'setup.hosp.placeholder': 'e.g. General Hospital, Ikeja',
      'setup.finish': 'Finish', 'setup.skip': 'Skip for now', 'setup.saved': 'Your details are saved',

      'home.greet.morning': 'Good morning', 'home.greet.afternoon': 'Good afternoon', 'home.greet.evening': 'Good evening',
      'home.sub': "We're here. Tell us what's happening.",
      'home.setHmo': 'Add your HMO',
      'home.voice.title': "What's happening?",
      'home.voice.hint': 'Hold to talk, or tap to start. English or Pidgin, up to 60 seconds.',
      'home.voice.aria': 'Record a voice note', 'home.voice.stopAria': 'Stop and send voice note',
      'home.voice.stop': 'Tap to send', 'home.voice.slide': 'Slide left to cancel', 'home.voice.release': 'Release to cancel',
      'home.voice.cancelled': 'Recording cancelled', 'home.voice.denied': "We can't use the microphone. Type your message instead.",
      'home.voice.limit': '60-second limit reached. Sending now.', 'home.voice.short': 'Hold a little longer to record.',
      'home.or': 'or type it', 'home.text.label': 'Describe the problem',
      'home.text.placeholder': 'e.g. They asked us to buy amoxicillin outside', 'home.send': 'Send',
      'home.quick': 'Quick picks', 'home.openCases': 'Open cases',
      'home.empty.title': 'No cases yet', 'home.empty.body': 'When you ask for help, your case and its timeline are saved here.',
      'home.lastScript': 'Your last script',
      'chip.buyOutside': 'Told to buy drugs outside', 'chip.payCash': 'Asked to pay cash',
      'chip.waitApproval': 'Waiting for approval', 'chip.referral': 'Referral delayed',

      'check.title': 'Checking your rights', 'check.sub': 'This takes a few seconds.',
      'check.listening': 'Listening', 'check.understanding': 'Understanding',
      'check.rules': 'Checking NHIA rules', 'check.writing': 'Writing your script',
      'check.heard': 'We heard', 'check.isRight': 'Is this right?', 'check.yes': 'Yes, continue', 'check.fix': 'Edit',

      'result.title': 'Your answer',
      'verdict.likely_covered': 'Likely covered', 'verdict.rule_applies': 'Your rights apply',
      'verdict.legit_charge': 'Valid charge', 'verdict.confirm_with_hmo': 'Confirm with your HMO',
      'result.confirm.title': 'Confirm with your HMO',
      'result.confirm.body': "We don't have a sourced rule for this exact case. Call your HMO before you pay anything.",
      'result.askFor': 'Ask for:', 'result.proof': 'Proof',
      'result.script': 'What to say at the desk', 'result.read': 'Read aloud', 'result.stop': 'Stop', 'result.show': 'Show desk',
      'result.hmoLabel': 'Your HMO', 'result.call': 'Call',
      'result.startTimer': 'Start 1-hour timer',
      'result.timerWhy': "Your HMO must reply within 1 hour. We'll time it and help you complain if they don't.",
      'result.viewTimer': 'View timer', 'result.complain': 'Write a complaint', 'result.newQ': 'Ask something else',
      'result.disclaimer': 'This is information about your rights, not medical advice. In an emergency, get treatment first.',
      'result.heardEdit': 'Not right? Edit',
      'sheet.rule': 'Rule', 'sheet.source': 'Source', 'sheet.date': 'Checked', 'sheet.open': 'Open the source',
      'sheet.lowConf': 'Low confidence: confirm with your HMO',

      'desk.title': 'Show this to the desk', 'desk.rotate': 'Rotate text', 'desk.close': 'Close desk view',

      'timer.title': '1-hour timer', 'timer.left': 'left', 'timer.overdue': 'Overdue by {m} min',
      'timer.overdueTitle': 'Your HMO is late',
      'timer.overdueBody': "The hour is up. You can escalate now and we'll write the complaint for you.",
      'timer.running': 'Waiting for your HMO', 'timer.warn': 'Less than 15 minutes left', 'timer.deadline': 'Deadline {t}',
      'timer.responded': 'HMO responded', 'timer.escalate': 'Escalate', 'timer.demo': 'Demo mode · 60× speed',
      'timer.sofar': 'Timeline so far', 'timer.respondedTitle': 'What did your HMO say?',
      'timer.gotCode': 'Gave the approval code', 'timer.calledBack': 'Called back, still waiting', 'timer.refused': 'Refused or no answer',
      'timer.code': 'Approval code (optional)', 'timer.announce': '{m} minutes left',
      'timer.none': 'There is no timer on this case.', 'timer.start': 'Start timer', 'timer.stopped': 'Timer stopped: approval received',
      'timer.overdueNotif': 'Your HMO missed the 1-hour deadline. Tap to escalate.',

      'complaint.title': 'Complaint', 'complaint.to': 'To: {r}', 'complaint.ladder': 'Escalation path', 'complaint.step': 'Step {n} of 3',
      'recipient.hmo': 'Your HMO', 'recipient.hmoInline': 'your HMO', 'recipient.nhia_call': 'NHIA call centre', 'recipient.nhia_enf': 'NHIA Enforcement',
      'complaint.details': 'Your details', 'complaint.name': 'Full name (as on your HMO card)', 'complaint.phone': 'Phone number',
      'complaint.enrollee': 'Enrollee ID (optional)',
      'complaint.why': "Why we need this: the HMO can't trace your case without your name and number. We encrypt them, and you can delete them any time.",
      'complaint.preview': 'Letter preview',
      'complaint.previewHint': 'Highlighted parts come from your details and case. Letters are written in English for the HMO and NHIA.',
      'complaint.send': 'Send it', 'complaint.email': 'Email', 'complaint.whatsapp': 'WhatsApp', 'complaint.pdf': 'Save PDF', 'complaint.copy': 'Copy text',
      'complaint.required': 'Add your name and phone number first.',
      'complaint.mark': "I've sent it", 'complaint.sent': 'Marked as sent to {r}',
      'complaint.next': 'No reply in 7 days? Next step: {r}', 'complaint.final': 'This is the final step. NHIA Enforcement will contact you.',

      'cases.title': 'My cases', 'cases.all': 'All', 'cases.open': 'Open', 'cases.closed': 'Closed',
      'cases.new': 'New case', 'cases.count': '{n} cases',
      'status.open': 'Open', 'status.waiting_hmo': 'Waiting for HMO', 'status.overdue': 'Overdue',
      'status.escalated': 'Escalated', 'status.resolved': 'Resolved', 'status.refunded': 'Refunded',
      'issue.drug_not_covered': 'Drug to buy outside', 'issue.cash_demanded': 'Cash demanded',
      'issue.auth_delay': 'Approval delay', 'issue.referral_delay': 'Referral delay', 'issue.other': 'Other issue',

      'case.title': 'Case', 'case.timeline': 'Timeline', 'case.add': 'Add to timeline', 'case.started': 'Started {t}',
      'case.markResolved': 'Mark resolved', 'case.markRefunded': 'Mark refunded',
      'case.amountPaid': 'How much did you pay? (₦)', 'case.amountRefund': 'How much was refunded? (₦)',
      'case.openTimer': 'Open timer', 'case.complain': 'Write complaint', 'case.viewAnswer': 'View answer',
      'case.add.called': 'HMO called back', 'case.add.code': 'Got approval code', 'case.add.paid': 'I paid money', 'case.add.note': 'Add a note',
      'case.note.placeholder': 'What happened?', 'case.delete': 'Delete this case', 'case.deleted': 'Case deleted',
      'case.notFound': "We couldn't find this case. It may have been deleted.", 'case.refundTotal': 'Refunded: ₦{amount}',
      'case.paidTotal': 'Paid so far: ₦{amount}',

      'event.message': 'You described the problem', 'event.verdict': 'CoverMe checked the rules',
      'event.timer_started': '1-hour timer started', 'event.hmo_responded': 'HMO responded',
      'event.code_received': 'Approval code received', 'event.hmo_called': 'HMO called back',
      'event.paid': 'Paid ₦{amount}', 'event.overdue': 'HMO missed the 1-hour deadline',
      'event.escalated': 'Complaint sent to {r}', 'event.resolved': 'Marked resolved',
      'event.refunded': 'Refunded ₦{amount}', 'event.note': 'Note', 'event.emergency': 'Emergency card shown',
      'event.refused': 'HMO refused or did not answer',

      'rights.title': 'Know your rights', 'rights.sub': '{n} rules, each with its source.',
      'rights.search': 'Search your rights', 'rights.none': 'No rules match “{q}”.',
      'rights.share': 'Share', 'rights.source': 'Source', 'rights.shared': 'Image ready to share',
      'rights.lowConf': 'Confirm with HMO',
      'topic.all': 'All', 'topic.drugs': 'Drugs', 'topic.payments': 'Payments', 'topic.referrals': 'Referrals',
      'topic.emergencies': 'Emergencies', 'topic.access': 'Access',

      'settings.title': 'Settings', 'settings.language': 'Language', 'settings.theme': 'Appearance',
      'theme.system': 'System', 'theme.light': 'Light', 'theme.dark': 'Dark',
      'settings.hmo': 'Your HMO details', 'settings.change': 'Change', 'settings.noHmo': 'Not set yet',
      'settings.notif': 'Timer alerts', 'settings.notif.sub': 'Notify me when my HMO is late',
      'settings.notif.denied': 'Notifications are blocked in your browser settings.',
      'settings.privacy': 'Privacy', 'settings.privacyNotice': 'Privacy notice', 'settings.replay': 'Replay the intro',
      'settings.install': 'Install CoverMe', 'settings.install.sub': 'Add it to your home screen. Works offline.',
      'settings.demo': 'Demo tools', 'settings.demoMode': 'Demo mode', 'settings.demoMode.sub': 'Timer runs at 60× speed',
      'settings.seed': 'Load a ready demo case', 'settings.simError': 'Simulate “couldn’t check”', 'settings.simError.sub': 'Next request fails, to show the error state',
      'settings.seeded': 'Demo case loaded',
      'settings.delete': 'Delete all my data',
      'settings.delete.sub': 'Removes your HMO details, cases, timelines and complaints.',
      'settings.about': 'About', 'settings.version': 'CoverMe template v0.1 · mock data',
      'delete.title': 'Delete everything?',
      'delete.body': "This removes {n} cases, their timelines and complaints, and your HMO details. It can't be undone.",
      'delete.confirm': 'Yes, delete everything', 'delete.done': 'All your data has been deleted.',

      'emg.title': 'Get treatment now at the nearest hospital.',
      'emg.body': 'Sort out the HMO later. In an emergency, the hospital should treat first and bill after.',
      'emg.call': 'Call 112', 'emg.rest': 'Show the rest of my answer', 'emg.close': 'Close',
      'emg.signs': 'Emergency signs: unconscious, not breathing, heavy bleeding, convulsions, an accident, or labour.',
      'emg.note': "If the button doesn't work, dial 112 on your phone.",

      'privacy.title': 'Privacy notice'
    },

    pcm: {
      'app.name': 'CoverMe',
      'nav.home': 'Home', 'nav.cases': 'My cases', 'nav.rights': 'My right', 'nav.settings': 'Settings',
      'common.back': 'Go back', 'common.close': 'Close am', 'common.cancel': 'Cancel', 'common.continue': 'Continue',
      'common.skip': 'Skip am', 'common.done': 'E don do', 'common.save': 'Save am', 'common.edit': 'Change am',
      'common.copy': 'Copy', 'common.copied': 'E don copy', 'common.seeAll': 'See all', 'common.emergency': 'Emergency help',
      'lang.switch': 'Language', 'lang.en': 'EN', 'lang.pcm': 'Pidgin',
      'offline.title': 'Network no dey.', 'offline.body': 'Your last script dey saved for down.',
      'offline.bodyGeneric': 'We go keep wetin you type and send am when network come back.',
      'error.title': 'We no fit check am now now.', 'error.body': 'See your HMO number. Call dem while we try again.',
      'error.retry': 'Try again', 'error.pick': 'Or pick wetin happen:',
      'time.justNow': 'just now', 'time.min': '{n} min ago', 'time.hour': '{n} hr ago', 'time.day': '{n} day ago',

      'welcome.s1.title': 'Know your right',
      'welcome.s1.body': 'For one minute, know wetin your HMO suppose cover, plus the NHIA rule wey prove am.',
      'welcome.s2.title': 'Talk the correct thing',
      'welcome.s2.body': 'Collect calm, polite talk wey you go show the hospital desk, and your HMO number dey one tap away.',
      'welcome.s3.title': 'Complain with one tap',
      'welcome.s3.body': 'If dem keep you wait, we go time am and write your complaint go HMO and NHIA.',
      'welcome.next': 'Next', 'welcome.start': 'Make we start', 'welcome.slide': 'Slide {n} for 3',
      'consent.title': 'Before we start',
      'consent.l1': 'We only collect wetin we need to help you. No account, no sickness details.',
      'consent.l2': 'AI (Google Gemini) go read your message make e understand am. Na our rules, no be the AI, dey decide wetin dey covered.',
      'consent.l3': 'You fit delete everything, anytime, with one tap.',
      'consent.agree': 'I don understand', 'consent.privacy': 'Read the privacy notice',
      'consent.notAdvice': 'CoverMe dey give information about your right. E no be doctor advice.',

      'setup.title': 'Set up', 'setup.step': 'Step {n} for 3',
      'setup.hmo.title': 'Who be your HMO?', 'setup.hmo.hint': 'E dey your HMO or NHIA card.',
      'setup.hmo.search': 'Find from 94 HMOs', 'setup.hmo.recent': 'Recent', 'setup.hmo.popular': 'Wey people dey use pass',
      'setup.hmo.all': 'All HMOs', 'setup.hmo.none': 'No HMO match “{q}”.', 'setup.hmo.notSure': 'I no know my HMO',
      'setup.plan.title': 'Which kind plan you get?', 'setup.plan.hint': 'Na this one go decide which rule follow you.',
      'setup.plan.nhia': 'NHIA (work/government)', 'setup.plan.nhia.sub': 'Through your work or federal government',
      'setup.plan.state': 'State health scheme', 'setup.plan.state.sub': 'Like LASHMA or KSCHMA',
      'setup.plan.private': 'Private plan', 'setup.plan.private.sub': 'You or your company buy am direct',
      'setup.plan.unsure': 'I no sure', 'setup.plan.unsure.sub': 'We go use NHIA rules and tell you when to confirm',
      'setup.hosp.title': 'Which hospital you dey?', 'setup.hosp.hint': 'E no compulsory. E go enter your complaint letter.',
      'setup.hosp.label': 'Hospital name', 'setup.hosp.placeholder': 'e.g. General Hospital, Ikeja',
      'setup.finish': 'Finish', 'setup.skip': 'Skip am for now', 'setup.saved': 'We don save your details',

      'home.greet.morning': 'Good morning o', 'home.greet.afternoon': 'Good afternoon o', 'home.greet.evening': 'Good evening o',
      'home.sub': 'We dey here. Tell us wetin dey happen.',
      'home.setHmo': 'Add your HMO',
      'home.voice.title': 'Wetin dey happen?',
      'home.voice.hint': 'Hold am talk, or tap make e start. English or Pidgin, reach 60 seconds.',
      'home.voice.aria': 'Record voice note', 'home.voice.stopAria': 'Stop and send the voice note',
      'home.voice.stop': 'Tap make e send', 'home.voice.slide': 'Drag go left make e cancel', 'home.voice.release': 'Leave am make e cancel',
      'home.voice.cancelled': 'Recording don cancel', 'home.voice.denied': 'We no fit use the microphone. Type your message instead.',
      'home.voice.limit': '60 seconds don reach. We dey send am now.', 'home.voice.short': 'Hold am small longer make e record.',
      'home.or': 'or type am', 'home.text.label': 'Talk wetin happen',
      'home.text.placeholder': 'e.g. Dem say make we buy amoxicillin outside', 'home.send': 'Send',
      'home.quick': 'Quick pick', 'home.openCases': 'Cases wey still dey open',
      'home.empty.title': 'No case yet', 'home.empty.body': 'When you ask for help, your case and im timeline go dey here.',
      'home.lastScript': 'Your last script',
      'chip.buyOutside': 'Dem say make I buy drug outside', 'chip.payCash': 'Dem say make I pay cash',
      'chip.waitApproval': 'We dey wait for approval', 'chip.referral': 'Referral dey delay',

      'check.title': 'We dey check your right', 'check.sub': 'E go take small seconds.',
      'check.listening': 'We dey listen', 'check.understanding': 'We dey understand',
      'check.rules': 'We dey check NHIA rules', 'check.writing': 'We dey write your script',
      'check.heard': 'Wetin we hear', 'check.isRight': 'Na so e be?', 'check.yes': 'Yes, continue', 'check.fix': 'Change am',

      'result.title': 'Your answer',
      'verdict.likely_covered': 'E fit dey covered', 'verdict.rule_applies': 'Your right dey here',
      'verdict.legit_charge': 'This charge dey legit', 'verdict.confirm_with_hmo': 'Confirm am with your HMO',
      'result.confirm.title': 'Confirm am with your HMO',
      'result.confirm.body': 'We no get rule wey get source for this exact matter. Call your HMO before you pay anything.',
      'result.askFor': 'Ask for:', 'result.proof': 'Proof',
      'result.script': 'Wetin to talk for desk', 'result.read': 'Read am out', 'result.stop': 'Stop am', 'result.show': 'Show desk',
      'result.hmoLabel': 'Your HMO', 'result.call': 'Call',
      'result.startTimer': 'Start 1-hour timer',
      'result.timerWhy': 'Your HMO suppose answer inside 1 hour. We go time am and help you complain if dem no answer.',
      'result.viewTimer': 'See timer', 'result.complain': 'Write complaint', 'result.newQ': 'Ask another thing',
      'result.disclaimer': 'This na information about your right, e no be doctor advice. If na emergency, collect treatment first.',
      'result.heardEdit': 'No be am? Change am',
      'sheet.rule': 'Rule', 'sheet.source': 'Where e come from', 'sheet.date': 'We check am', 'sheet.open': 'Open the source',
      'sheet.lowConf': 'We no too sure: confirm with your HMO',

      'desk.title': 'Show this one to the desk', 'desk.rotate': 'Turn the writing', 'desk.close': 'Close desk view',

      'timer.title': '1-hour timer', 'timer.left': 'remain', 'timer.overdue': 'E don pass by {m} min',
      'timer.overdueTitle': 'Your HMO don late',
      'timer.overdueBody': 'The one hour don finish. You fit escalate now, we go write the complaint for you.',
      'timer.running': 'We dey wait for your HMO', 'timer.warn': 'E remain less than 15 minutes', 'timer.deadline': 'Deadline {t}',
      'timer.responded': 'HMO don answer', 'timer.escalate': 'Escalate am', 'timer.demo': 'Demo mode · 60× speed',
      'timer.sofar': 'Wetin don happen so far', 'timer.respondedTitle': 'Wetin your HMO talk?',
      'timer.gotCode': 'Dem give approval code', 'timer.calledBack': 'Dem call back, we still dey wait', 'timer.refused': 'Dem refuse or no answer',
      'timer.code': 'Approval code (if you get am)', 'timer.announce': '{m} minutes remain',
      'timer.none': 'This case no get timer.', 'timer.start': 'Start timer', 'timer.stopped': 'Timer don stop: approval don come',
      'timer.overdueNotif': 'Your HMO no answer inside 1 hour. Tap make you escalate.',

      'complaint.title': 'Complaint', 'complaint.to': 'Go: {r}', 'complaint.ladder': 'How e go escalate', 'complaint.step': 'Step {n} for 3',
      'recipient.hmo': 'Your HMO', 'recipient.hmoInline': 'your HMO', 'recipient.nhia_call': 'NHIA call centre', 'recipient.nhia_enf': 'NHIA Enforcement',
      'complaint.details': 'Your details', 'complaint.name': 'Full name (as e dey your HMO card)', 'complaint.phone': 'Phone number',
      'complaint.enrollee': 'Enrollee ID (if you get am)',
      'complaint.why': 'Why we need am: HMO no fit find your case without your name and number. We dey lock am (encrypt), and you fit delete am anytime.',
      'complaint.preview': 'See the letter',
      'complaint.previewHint': 'The marked part na from your details and your case. We dey write the letter for English because na HMO and NHIA go read am.',
      'complaint.send': 'Send am', 'complaint.email': 'Email', 'complaint.whatsapp': 'WhatsApp', 'complaint.pdf': 'Save PDF', 'complaint.copy': 'Copy the text',
      'complaint.required': 'Put your name and phone number first.',
      'complaint.mark': 'I don send am', 'complaint.sent': 'We don mark am say e reach {r}',
      'complaint.next': 'If dem no answer for 7 days, next na: {r}', 'complaint.final': 'This na the last step. NHIA Enforcement go contact you.',

      'cases.title': 'My cases', 'cases.all': 'All', 'cases.open': 'Open', 'cases.closed': 'Don close',
      'cases.new': 'New case', 'cases.count': '{n} cases',
      'status.open': 'Open', 'status.waiting_hmo': 'We dey wait HMO', 'status.overdue': 'E don pass time',
      'status.escalated': 'We don escalate', 'status.resolved': 'E don sort', 'status.refunded': 'Dem don refund',
      'issue.drug_not_covered': 'Drug wey dem say buy outside', 'issue.cash_demanded': 'Dem demand cash',
      'issue.auth_delay': 'Approval dey delay', 'issue.referral_delay': 'Referral dey delay', 'issue.other': 'Another matter',

      'case.title': 'Case', 'case.timeline': 'Timeline', 'case.add': 'Add to timeline', 'case.started': 'E start {t}',
      'case.markResolved': 'E don sort', 'case.markRefunded': 'Dem don refund me',
      'case.amountPaid': 'How much you pay? (₦)', 'case.amountRefund': 'How much dem refund? (₦)',
      'case.openTimer': 'Open timer', 'case.complain': 'Write complaint', 'case.viewAnswer': 'See answer',
      'case.add.called': 'HMO call back', 'case.add.code': 'I get approval code', 'case.add.paid': 'I pay money', 'case.add.note': 'Add note',
      'case.note.placeholder': 'Wetin happen?', 'case.delete': 'Delete this case', 'case.deleted': 'Case don delete',
      'case.notFound': 'We no see this case. Maybe dem don delete am.', 'case.refundTotal': 'Refund: ₦{amount}',
      'case.paidTotal': 'Wetin you don pay: ₦{amount}',

      'event.message': 'You talk wetin happen', 'event.verdict': 'CoverMe check the rules',
      'event.timer_started': '1-hour timer don start', 'event.hmo_responded': 'HMO don answer',
      'event.code_received': 'Approval code don come', 'event.hmo_called': 'HMO call back',
      'event.paid': 'You pay ₦{amount}', 'event.overdue': 'HMO no answer inside 1 hour',
      'event.escalated': 'Complaint don go {r}', 'event.resolved': 'E don sort',
      'event.refunded': 'Dem refund ₦{amount}', 'event.note': 'Note', 'event.emergency': 'Emergency card show',
      'event.refused': 'HMO refuse or no answer',

      'rights.title': 'Know your right', 'rights.sub': '{n} rules, each one get im source.',
      'rights.search': 'Find your right', 'rights.none': 'No rule match “{q}”.',
      'rights.share': 'Share am', 'rights.source': 'Source', 'rights.shared': 'Picture don ready to share',
      'rights.lowConf': 'Confirm with HMO',
      'topic.all': 'All', 'topic.drugs': 'Drugs', 'topic.payments': 'Money', 'topic.referrals': 'Referral',
      'topic.emergencies': 'Emergency', 'topic.access': 'Access',

      'settings.title': 'Settings', 'settings.language': 'Language', 'settings.theme': 'How e go look',
      'theme.system': 'Phone setting', 'theme.light': 'Light', 'theme.dark': 'Dark',
      'settings.hmo': 'Your HMO details', 'settings.change': 'Change am', 'settings.noHmo': 'You never set am',
      'settings.notif': 'Timer alert', 'settings.notif.sub': 'Tell me when my HMO don late',
      'settings.notif.denied': 'Your browser don block notification.',
      'settings.privacy': 'Privacy', 'settings.privacyNotice': 'Privacy notice', 'settings.replay': 'Show the intro again',
      'settings.install': 'Install CoverMe', 'settings.install.sub': 'Put am for your home screen. E dey work without network.',
      'settings.demo': 'Demo tools', 'settings.demoMode': 'Demo mode', 'settings.demoMode.sub': 'Timer go run 60× fast',
      'settings.seed': 'Load demo case wey don ready', 'settings.simError': 'Pretend say check fail', 'settings.simError.sub': 'Next request go fail, to show the error screen',
      'settings.seeded': 'Demo case don load',
      'settings.delete': 'Delete all my data',
      'settings.delete.sub': 'E go remove your HMO details, cases, timeline and complaint.',
      'settings.about': 'About', 'settings.version': 'CoverMe template v0.1 · mock data',
      'delete.title': 'You wan delete everything?',
      'delete.body': 'This one go remove {n} cases, their timeline and complaint, plus your HMO details. You no fit bring am back.',
      'delete.confirm': 'Yes, delete everything', 'delete.done': 'We don delete all your data.',

      'emg.title': 'Go collect treatment now for the nearest hospital.',
      'emg.body': 'HMO matter fit wait. For emergency, hospital suppose treat first, bill after.',
      'emg.call': 'Call 112', 'emg.rest': 'Show the rest of my answer', 'emg.close': 'Close am',
      'emg.signs': 'Emergency signs: person no wake, no dey breathe, plenty blood, convulsion, accident, or labour.',
      'emg.note': 'If the button no work, dial 112 for your phone.',

      'privacy.title': 'Privacy notice'
    }
  };

  const KEY = 'cm.lang';
  let lang = 'en';
  try { lang = localStorage.getItem(KEY) || (navigator.language || '').startsWith('pcm') && 'pcm' || 'en'; } catch (e) {}

  CM.t = function (key, vars) {
    let s = (S[lang] && S[lang][key]) || S.en[key] || key;
    if (vars) for (const k in vars) s = s.split('{' + k + '}').join(vars[k]);
    return s;
  };
  /* Pick from a bilingual value { en, pcm } or return a plain string as-is */
  CM.L = function (v) { return v && typeof v === 'object' ? (v[lang] || v.en) : v; };

  CM.i18n = {
    get lang() { return lang; },
    set(next) {
      if (!S[next] || next === lang) return;
      lang = next;
      try { localStorage.setItem(KEY, next); } catch (e) {}
      this.apply(document);
      document.dispatchEvent(new CustomEvent('cm:lang', { detail: { lang } }));
    },
    apply(root) {
      root = root || document;
      document.documentElement.lang = lang === 'pcm' ? 'pcm' : 'en';
      root.querySelectorAll('[data-i18n]').forEach(function (el) { el.textContent = CM.t(el.dataset.i18n); });
      root.querySelectorAll('[data-i18n-attr]').forEach(function (el) {
        el.dataset.i18nAttr.split(';').forEach(function (pair) {
          const [attr, key] = pair.split(':').map(function (s) { return s.trim(); });
          if (attr && key) el.setAttribute(attr, CM.t(key));
        });
      });
      root.querySelectorAll('[data-lang-only]').forEach(function (el) { el.hidden = el.dataset.langOnly !== lang; });
    }
  };
})();
