// Full content for the 7 core courses every profession gets. Lesson text uses the LessonContent line format
// (## heading, - bullet, > takeaway, SAY:/AVOID: phrases). {product} is replaced with the profession's product.
type T = { en: string; ka: string };
type Q = { q: T; o: T[]; c: number };
export type Core = { title: T; desc: T; min: number; lessons: { title: T; body: T }[]; quiz: Q[] };
const t = (en: string, ka: string): T => ({ en, ka });
const q = (q: T, o: T[], c: number): Q => ({ q, o, c });

export const CORE: Record<string, Core> = {
  opening: {
    title: t("The first 30 seconds", "პირველი 30 წამი"), min: 30,
    desc: t("Open a call so the customer wants to keep talking: a clear intro, a reason that matters to them, and a question that starts a real conversation.",
      "დაიწყე ზარი ისე, რომ მომხმარებელს საუბრის გაგრძელება მოუნდეს: მკაფიო წარდგენა, მისთვის მნიშვნელოვანი მიზეზი და კითხვა, რომელიც ნამდვილ საუბარს იწყებს."),
    lessons: [
      { title: t("Why the first seconds decide the call", "რატომ წყვეტს პირველი წამები ზარს"),
        body: t(`In the first seconds the customer decides one thing: is this worth my time? They can't see you, so they judge your voice, your pace and whether you sound like every other sales call.
## What the customer is asking silently
- Who is this?
- Why are they calling me?
- Is this going to be useful or a pitch?
Your opening has to answer all three before they ask.
> Start with the customer, not with your product. Nobody wants a feature list from a stranger.`,
          `პირველ წამებში მომხმარებელი ერთ რამეს წყვეტს: ღირს თუ არა ეს ჩემს დროდ? ის ვერ გხედავს, ამიტომ გაფასებს ხმით, ტემპით და იმით, ჰგავხარ თუ არა ყველა სხვა გამყიდველს.
## რას კითხულობს მომხმარებელი გულში
- ვინ არის ეს?
- რატომ მირეკავს?
- სასარგებლო იქნება თუ უბრალოდ რაღაცას მიყიდის?
შენმა დასაწყისმა სამივეს უნდა უპასუხოს, სანამ იკითხავს.
> დაიწყე მომხმარებლით და არა პროდუქტით. უცნობისგან ფუნქციების ჩამონათვალი არავის უნდა.`) },
      { title: t("The 3-part opener", "სამნაწილიანი დასაწყისი"),
        body: t(`A strong opening has three parts, and it fits in about 20 seconds.
## 1. Short introduction
Your name and company in one sentence. No titles, no history.
## 2. A reason that matters to them
Why you are calling this person, today. A trigger (they moved, grew, asked, changed something) beats a generic reason.
## 3. An open question
Hand the conversation to them with a question they can answer easily.
SAY: Hi Nino, it's Luka from our team. I noticed you were looking at options like {product}; can I ask what made you start looking?
AVOID: Hi, how are you today? Let me tell you about our amazing company and everything we offer.
> Intro, reason, question. Then stop talking and listen.`,
          `ძლიერ დასაწყისს სამი ნაწილი აქვს და დაახლოებით 20 წამში ეტევა.
## 1. მოკლე წარდგენა
შენი სახელი და კომპანია ერთ წინადადებაში. თანამდებობებისა და ისტორიის გარეშე.
## 2. მისთვის მნიშვნელოვანი მიზეზი
რატომ ურეკავ სწორედ ამ ადამიანს და სწორედ დღეს. კონკრეტული მიზეზი (გადავიდა, გაიზარდა, იკითხა, რაღაც შეცვალა) ზოგადს ყოველთვის სჯობს.
## 3. ღია კითხვა
გადაეცი საუბარი მას კითხვით, რომელზეც ადვილად უპასუხებს.
SAY: გამარჯობა ნინო, ლუკა ვარ. დავინახე, რომ ასეთ ვარიანტს ეძებდით ({product}). შეიძლება გკითხოთ, რამ დაგაწყებინათ ძებნა?
AVOID: გამარჯობა, როგორ ხართ? ახლა მოგიყვებით ჩვენს შესანიშნავ კომპანიაზე და ყველაფერზე, რასაც გთავაზობთ.
> წარდგენა, მიზეზი, კითხვა. მერე გაჩუმდი და მოუსმინე.`) },
      { title: t("Tone, pace and permission", "ტონი, ტემპი და ნებართვა"),
        body: t(`How you sound matters as much as what you say.
- Smile while you talk; it changes your voice.
- Slow down slightly in the first 10 seconds; nerves make everyone rush.
- Sound like a peer, not a script: short sentences, natural words.
- Ask for a little time instead of assuming it.
SAY: Do you have two minutes now, or is later today better?
SAY: If it's not relevant, just tell me and I'll let you go.
AVOID: This will only take a second! (then talking for five minutes)
> Asking permission lowers resistance. A customer who chose to listen listens better.`,
          `როგორ ჟღერს შენი ხმა, ისეთივე მნიშვნელოვანია, როგორც ის, რას ამბობ.
- ილაპარაკე ღიმილით, ეს ხმას ცვლის.
- პირველ 10 წამში ოდნავ შეანელე ტემპი, ღელვა ყველას აჩქარებს.
- ჟღერდე როგორც თანასწორი და არა როგორც სკრიპტი: მოკლე წინადადებები, ბუნებრივი სიტყვები.
- ითხოვე ცოტა დრო და ნუ ჩათვლი, რომ უკვე გაქვს.
SAY: ახლა ორი წუთი გაქვთ, თუ დღეს მოგვიანებით ჯობია?
SAY: თუ არ გაინტერესებთ, პირდაპირ მითხარით და აღარ შეგაწუხებთ.
AVOID: სულ ერთი წამით! (და მერე ხუთი წუთი ლაპარაკი)
> ნებართვის თხოვნა წინააღმდეგობას ამცირებს. მომხმარებელი, რომელმაც თვითონ აირჩია მოსმენა, უკეთ უსმენს.`) },
    ],
    quiz: [
      q(t("What should a strong opening start with?", "რით უნდა დაიწყოს ძლიერი დასაწყისი?"),
        [t("The customer and a reason that matters to them", "მომხმარებლით და მისთვის მნიშვნელოვანი მიზეზით"), t("A full list of product features", "პროდუქტის ფუნქციების სრული სიით"), t("The company's history", "კომპანიის ისტორიით")], 0),
      q(t("What are the three parts of the opener?", "რა სამი ნაწილისგან შედგება დასაწყისი?"),
        [t("Price, discount, deadline", "ფასი, ფასდაკლება, ვადა"), t("Intro, reason, open question", "წარდგენა, მიზეზი, ღია კითხვა"), t("Greeting, joke, pitch", "მისალმება, ხუმრობა, პიჩი")], 1),
      q(t("Which opening line is weakest?", "რომელია ყველაზე სუსტი დასაწყისი?"),
        [t("'Can I ask what made you start looking?'", "„შეიძლება გკითხოთ, რამ დაგაწყებინათ ძებნა?“"), t("'Do you have two minutes now?'", "„ახლა ორი წუთი გაქვთ?“"), t("'How are you today? Let me tell you about us.'", "„როგორ ხართ? მოგიყვებით ჩვენზე.“")], 2),
      q(t("Why ask for permission at the start?", "რატომ უნდა ითხოვო ნებართვა დასაწყისში?"),
        [t("It lowers resistance and they listen better", "წინააღმდეგობას ამცირებს და უკეთ გისმენს"), t("It makes the call longer", "ზარს აგრძელებს"), t("It's required by law", "კანონით სავალდებულოა")], 0),
      q(t("What should you do right after your opening question?", "რა უნდა გააკეთო დასაწყისი კითხვის შემდეგ?"),
        [t("Answer it yourself", "თვითონ უპასუხო"), t("Stop talking and listen", "გაჩუმდე და მოუსმინო"), t("Ask three more questions at once", "ერთად კიდევ სამი კითხვა დასვა")], 1),
    ],
  },

  discovery: {
    title: t("Discovery questions", "სწორი კითხვები"), min: 35,
    desc: t("Find the customer's real problem with open questions, follow-ups and active listening, so your offer fits them instead of a script.",
      "იპოვე მომხმარებლის ნამდვილი პრობლემა ღია კითხვებით, დამატებითი კითხვებით და აქტიური მოსმენით, რომ შენი შეთავაზება მას მოერგოს და არა სკრიპტს."),
    lessons: [
      { title: t("Open vs closed questions", "ღია და დახურული კითხვები"),
        body: t(`Closed questions get yes or no. Open questions get stories, and stories contain the real problem.
## Open question starters
- What made you start looking for {product}?
- How are you handling this today?
- Why is this important right now?
- What would a good result look like for you?
Closed questions are still useful, but only to confirm details at the end.
SAY: How are you solving this at the moment?
AVOID: Are you happy with your current option? (yes/no, conversation over)
> One open question can teach you more than ten closed ones.`,
          `დახურულ კითხვაზე პასუხია „კი“ ან „არა“. ღია კითხვაზე მომხმარებელი ამბავს გიყვება, და ამ ამბავში ნამდვილი პრობლემაა.
## ღია კითხვის დასაწყისები
- რამ დაგაწყებინათ ძებნა? ({product})
- როგორ აგვარებთ ამას დღეს?
- რატომ არის ეს ახლა მნიშვნელოვანი?
- როგორ გამოიყურება თქვენთვის კარგი შედეგი?
დახურული კითხვებიც სასარგებლოა, მაგრამ მხოლოდ ბოლოს, დეტალების დასადასტურებლად.
SAY: ახლა როგორ აგვარებთ ამას?
AVOID: კმაყოფილი ხართ ახლანდელი ვარიანტით? (კი/არა, და საუბარი დასრულდა)
> ერთი ღია კითხვა იმაზე მეტს გასწავლის, ვიდრე ათი დახურული.`) },
      { title: t("Dig deeper: the follow-up", "ჩაუღრმავდი: დამატებითი კითხვა"),
        body: t(`The first answer is usually the polite, surface answer. The real reason comes after a follow-up.
## Three follow-ups that always work
- Tell me more about that.
- What does that cost you, in time or money?
- What happens if nothing changes?
## The 70/30 rule
Let the customer talk about 70% of the time. Your job is to guide, not to fill the silence.
SAY: You said it takes too long. How long, roughly, and what does that mean for you?
AVOID: Right, we can fix that! Here's our solution... (jumping in after the first answer)
> Don't solve the first problem you hear. Ask one more question first.`,
          `პირველი პასუხი ჩვეულებრივ თავაზიანი და ზედაპირულია. ნამდვილი მიზეზი დამატებითი კითხვის მერე ჩნდება.
## სამი დამატებითი კითხვა, რომელიც ყოველთვის მუშაობს
- უფრო მეტი მომიყევით ამაზე.
- რა გიჯდებათ ეს, დროში ან ფულში?
- რა მოხდება, თუ არაფერი შეიცვლება?
## 70/30 წესი
მიეცი მომხმარებელს ლაპარაკის საშუალება დროის დაახლოებით 70%-ის განმავლობაში. შენი საქმეა საუბრის მართვა და არა სიჩუმის შევსება.
SAY: თქვით, რომ ძალიან დიდ დროს იკავებს. დაახლოებით რამდენს, და რას ნიშნავს ეს თქვენთვის?
AVOID: გასაგებია, ამას მოვაგვარებთ! აი ჩვენი გადაწყვეტა... (პირველივე პასუხის მერე)
> ნუ გადაჭრი პირველ პრობლემას, რასაც მოისმენ. ჯერ კიდევ ერთი კითხვა დასვი.`) },
      { title: t("Listen, summarise, confirm", "მოუსმინე, შეაჯამე, დაადასტურე"),
        body: t(`Before you present anything, show the customer you understood them.
## The summary technique
- Repeat their situation in your own words.
- Name the main problem and what it costs them.
- Ask if you got it right.
When the customer says "Yes, exactly", they are ready to hear your solution, and they trust it more because it's built on their words.
SAY: So if I understood you right: you need X, the main problem is Y, and it's costing you Z. Is that fair?
AVOID: OK, great. So, our product... (no summary, straight into the pitch)
> Your offer should sound like the answer to what they just told you.`,
          `სანამ რაიმეს შესთავაზებ, აჩვენე მომხმარებელს, რომ გაიგე.
## შეჯამების ტექნიკა
- გაიმეორე მისი სიტუაცია შენი სიტყვებით.
- დაასახელე მთავარი პრობლემა და რა უჯდება.
- ჰკითხე, სწორად გაიგე თუ არა.
როცა მომხმარებელი ამბობს „დიახ, ზუსტად“, მზადაა მოისმინოს შენი გადაწყვეტა. და უფრო ენდობა, რადგან ის მისივე სიტყვებზეა აგებული.
SAY: თუ სწორად გავიგე: გჭირდებათ X, მთავარი პრობლემა Y-ია და ეს Z-ი გიჯდებათ. ასეა?
AVOID: კარგი, მშვენიერია. ასე რომ, ჩვენი პროდუქტი... (შეჯამების გარეშე, პირდაპირ პიჩზე)
> შენი შეთავაზება უნდა ჟღერდეს როგორც პასუხი იმაზე, რაც მან ახლახან გითხრა.`) },
    ],
    quiz: [
      q(t("Which is an open question?", "რომელია ღია კითხვა?"),
        [t("'Are you happy with your current option?'", "„კმაყოფილი ხართ ახლანდელი ვარიანტით?“"), t("'How are you solving this today?'", "„როგორ აგვარებთ ამას დღეს?“"), t("'Do you want to buy?'", "„გინდათ ყიდვა?“")], 1),
      q(t("What does the 70/30 rule mean?", "რას ნიშნავს 70/30 წესი?"),
        [t("The customer talks about 70% of the time", "მომხმარებელი დროის დაახლოებით 70%-ს ლაპარაკობს"), t("You talk 70% of the time", "შენ ლაპარაკობ დროის 70%-ს"), t("70% discount, 30% profit", "70% ფასდაკლება, 30% მოგება")], 0),
      q(t("The customer gives a first, short answer. What next?", "მომხმარებელმა პირველი, მოკლე პასუხი გაგცა. შემდეგ?"),
        [t("Present your solution immediately", "მაშინვე შესთავაზე გადაწყვეტა"), t("Change the topic", "თემა შეცვალე"), t("Ask a follow-up question", "დასვი დამატებითი კითხვა")], 2),
      q(t("Which follow-up reveals the cost of the problem?", "რომელი დამატებითი კითხვა აჩენს პრობლემის ფასს?"),
        [t("'What does that cost you, in time or money?'", "„რა გიჯდებათ ეს, დროში ან ფულში?“"), t("'Do you like our website?'", "„მოგწონთ ჩვენი საიტი?“"), t("'Can I send a brochure?'", "„შეიძლება ბროშურა გამოგიგზავნოთ?“")], 0),
      q(t("Why summarise before presenting?", "რატომ უნდა შეაჯამო შეთავაზებამდე?"),
        [t("To make the call longer", "ზარის გასაგრძელებლად"), t("So your offer is built on their words and they trust it", "რომ შეთავაზება მის სიტყვებზე იყოს აგებული და ენდოს"), t("Because it's polite", "რადგან ზრდილობიანია")], 1),
    ],
  },

  objections: {
    title: t("Handling objections", "წინააღმდეგობების დაძლევა"), min: 40,
    desc: t("Treat objections as interest: the LAER method, the four most common objections, and calm phrases that keep the conversation going.",
      "აღიქვი წინააღმდეგობა ინტერესად: LAER მეთოდი, ოთხი ყველაზე გავრცელებული წინააღმდეგობა და მშვიდი ფრაზები, რომლებიც საუბარს აგრძელებს."),
    lessons: [
      { title: t("An objection is a sign of interest", "წინააღმდეგობა ინტერესის ნიშანია"),
        body: t(`A customer who doesn't care just says goodbye. A customer who objects is still thinking about it.
## Why customers object
- They don't see enough value yet.
- They're afraid of making a mistake.
- Something is unclear.
- It's a reflex; they say it to everyone.
Your job isn't to win an argument. It's to find out which of these it is.
AVOID: No, you're wrong, it's actually cheap!
SAY: That's a fair point. Can I ask what you're comparing it to?
> Stay calm and curious. An objection is a question in disguise.`,
          `მომხმარებელი, რომელსაც არ აინტერესებს, უბრალოდ გემშვიდობება. მომხმარებელი, რომელიც გეწინააღმდეგება, ჯერ კიდევ ფიქრობს.
## რატომ ეწინააღმდეგებიან
- ჯერ საკმარის ღირებულებას ვერ ხედავენ.
- შეცდომის ეშინიათ.
- რაღაც გაუგებარია.
- რეფლექსია, ყველას ასე პასუხობენ.
შენი საქმე კამათის მოგება არ არის. უნდა გაარკვიო, რომელია მათგან.
AVOID: არა, ცდებით, სინამდვილეში იაფია!
SAY: სამართლიანი შენიშვნაა. შეიძლება გკითხოთ, რას ადარებთ?
> დარჩი მშვიდი და ცნობისმოყვარე. წინააღმდეგობა შენიღბული კითხვაა.`) },
      { title: t("The LAER method", "LAER მეთოდი"),
        body: t(`LAER is a simple 4-step response to any objection.
## L — Listen
Let them finish. Don't interrupt with an answer.
## A — Acknowledge
Show you heard it: "I understand, that's important."
## E — Explore
Ask a question to find the real concern behind the words.
## R — Respond
Answer the real concern, then check: "Does that address it?"
SAY: I understand. When you say it's too expensive, is it the total price or the monthly payment?
AVOID: (interrupting) But wait, you haven't heard about the discount yet!
> Most sellers jump from Listen straight to Respond. The money is in Explore.`,
          `LAER არის მარტივი 4-ნაბიჯიანი პასუხი ნებისმიერ წინააღმდეგობაზე.
## L — მოუსმინე (Listen)
დაასრულებინე. ნუ შეაწყვეტინებ პასუხით.
## A — აღიარე (Acknowledge)
აჩვენე, რომ გაიგე: „გასაგებია, ეს მნიშვნელოვანია.“
## E — გამოიკვლიე (Explore)
დასვი კითხვა, რომ სიტყვების უკან ნამდვილი შეშფოთება იპოვო.
## R — უპასუხე (Respond)
უპასუხე ნამდვილ შეშფოთებას და გადაამოწმე: „ეს პასუხობს თქვენს კითხვას?“
SAY: გასაგებია. როცა ამბობთ, რომ ძვირია, საერთო ფასს გულისხმობთ თუ ყოველთვიურ გადასახადს?
AVOID: (შეწყვეტინებით) მოიცადეთ, ფასდაკლებაზე ჯერ არ მოგისმენიათ!
> გამყიდველების უმეტესობა მოსმენიდან პირდაპირ პასუხზე ხტება. ფული გამოკვლევაშია.`) },
      { title: t("The four common objections", "ოთხი გავრცელებული წინააღმდეგობა"),
        body: t(`Almost every objection is one of these four. Prepare an answer for each before your next call.
## "It's too expensive"
Usually means the value isn't clear yet. Go back to what the problem costs them.
SAY: Compared to what it's costing you now, how does the price look?
## "I'll think about it"
Usually means there's an unspoken doubt.
SAY: Of course. What part would you like to think over? Maybe I can help now.
## "I already have something"
SAY: Great. What would you change about it if you could?
## "Send me information"
Often a polite exit.
SAY: Happy to. So I send the right thing, what matters most to you?
> Write your own answer to all four. Prepared calm beats improvised panic.`,
          `თითქმის ყოველი წინააღმდეგობა ამ ოთხიდან ერთ-ერთია. შემდეგ ზარამდე თითოეულზე პასუხი მოამზადე.
## „ძალიან ძვირია“
ჩვეულებრივ ნიშნავს, რომ ღირებულება ჯერ არ არის ნათელი. დაუბრუნდი იმას, რა უჯდება პრობლემა.
SAY: იმასთან შედარებით, რაც ახლა გიჯდებათ, როგორ გამოიყურება ფასი?
## „ვიფიქრებ“
ჩვეულებრივ ნიშნავს, რომ რაღაც უთქმელი ეჭვია.
SAY: რა თქმა უნდა. კონკრეტულად რაზე გინდათ ფიქრი? იქნებ ახლავე დაგეხმაროთ.
## „უკვე მაქვს რაღაც“
SAY: მშვენიერია. რას შეცვლიდით მასში, რომ შეგეძლოთ?
## „ინფორმაცია გამომიგზავნეთ“
ხშირად თავაზიანი გასასვლელია.
SAY: სიამოვნებით. რომ სწორი რამ გამოგიგზავნოთ, რა არის თქვენთვის ყველაზე მნიშვნელოვანი?
> დაწერე შენი პასუხი ოთხივეზე. მომზადებული სიმშვიდე იმპროვიზებულ პანიკას სჯობს.`) },
    ],
    quiz: [
      q(t("What does an objection usually signal?", "რაზე მიუთითებს ჩვეულებრივ წინააღმდეგობა?"),
        [t("The customer is still interested and thinking", "მომხმარებელი ჯერ კიდევ დაინტერესებულია და ფიქრობს"), t("The call is lost", "ზარი წაგებულია"), t("You should hang up", "უნდა გათიშო")], 0),
      q(t("What does the E in LAER stand for?", "რას ნიშნავს E LAER-ში?"),
        [t("Explain", "ახსენი"), t("Explore", "გამოიკვლიე"), t("End", "დაასრულე")], 1),
      q(t("Which step do most sellers skip?", "რომელ ნაბიჯს გამოტოვებს გამყიდველების უმეტესობა?"),
        [t("Listen", "მოსმენა"), t("Respond", "პასუხი"), t("Explore", "გამოკვლევა")], 2),
      q(t("'Send me information' often means…", "„ინფორმაცია გამომიგზავნეთ“ ხშირად ნიშნავს…"),
        [t("A polite exit", "თავაზიან გასასვლელს"), t("They are ready to buy", "ყიდვისთვის მზადაა"), t("They want a discount", "ფასდაკლება უნდა")], 0),
      q(t("Best answer to 'I'll think about it'?", "საუკეთესო პასუხი „ვიფიქრებ“-ზე?"),
        [t("'OK, bye!'", "„კარგი, ნახვამდის!“"), t("'What part would you like to think over?'", "„კონკრეტულად რაზე გინდათ ფიქრი?“"), t("'You have to decide now.'", "„ახლავე უნდა გადაწყვიტოთ.“")], 1),
    ],
  },

  closing: {
    title: t("Closing the deal", "გარიგების დახურვა"), min: 35,
    desc: t("Recognise buying signals, summarise the value and ask for the decision directly, without pressure, ending every call with a clear next step.",
      "ამოიცანი ყიდვის ნიშნები, შეაჯამე ღირებულება და პირდაპირ სთხოვე გადაწყვეტილება, ზეწოლის გარეშე, და ყოველი ზარი მკაფიო შემდეგი ნაბიჯით დაასრულე."),
    lessons: [
      { title: t("Spot the buying signals", "ყიდვის ნიშნების ამოცნობა"),
        body: t(`Customers tell you when they're ready, just not in those words.
## Typical buying signals
- Questions about details: delivery, start date, payment.
- Talking as if they already own it: "So I would...".
- Asking about guarantees or what happens if something goes wrong.
- Their tone gets more relaxed and specific.
When you hear a signal, stop presenting. More information now can only create new doubts.
SAY: Sounds like this could work for you. Shall we look at the next step?
AVOID: (ignoring the signal) And there's also another feature I haven't mentioned...
> When they start asking "how", stop selling "why".`,
          `მომხმარებლები გეუბნებიან, როცა მზად არიან, უბრალოდ ამ სიტყვებით არა.
## ყიდვის ტიპური ნიშნები
- კითხვები დეტალებზე: მიწოდება, დაწყების თარიღი, გადახდა.
- ლაპარაკობს ისე, თითქოს უკვე ეკუთვნის: „მაშინ მე...“.
- კითხულობს გარანტიაზე ან იმაზე, რა მოხდება, თუ რამე არ გამოვა.
- ტონი უფრო მშვიდი და კონკრეტული ხდება.
როცა ნიშანს გაიგებ, შეწყვიტე პრეზენტაცია. დამატებითი ინფორმაცია ახლა მხოლოდ ახალ ეჭვებს გააჩენს.
SAY: როგორც ჩანს, ეს შეიძლება თქვენთვის გამოდგეს. გადავხედოთ შემდეგ ნაბიჯს?
AVOID: (ნიშნის იგნორირებით) და კიდევ არის ერთი ფუნქცია, რომელიც არ მიხსენებია...
> როცა იწყებს კითხვას „როგორ“, შეწყვიტე „რატომ“-ის გაყიდვა.`) },
      { title: t("Summarise, then ask", "შეაჯამე და მერე იკითხე"),
        body: t(`Closing isn't pressure. It's the natural next step after you've helped the customer see the value.
## The closing sequence
- Summarise what they need, in their words.
- Connect it to what you offer ({product}).
- Ask directly for the decision.
## Offer two good options
People find it easier to choose between two options than to say yes or no.
SAY: Based on what you told me, the standard option covers everything you need. Shall we start with that, or would you prefer the extended one?
AVOID: So... what do you think? Maybe let me know sometime?
> If you don't ask, the answer is always no.`,
          `დახურვა ზეწოლა არ არის. ეს ბუნებრივი შემდეგი ნაბიჯია მას შემდეგ, რაც მომხმარებელს ღირებულების დანახვაში დაეხმარე.
## დახურვის თანმიმდევრობა
- შეაჯამე, რა სჭირდება, მისივე სიტყვებით.
- დაუკავშირე იმას, რასაც სთავაზობ ({product}).
- პირდაპირ სთხოვე გადაწყვეტილება.
## შესთავაზე ორი კარგი ვარიანტი
ადამიანებს ორ ვარიანტს შორის არჩევა უფრო უადვილდებათ, ვიდრე „კი“ ან „არა“-ს თქმა.
SAY: რაც მითხარით, იმის მიხედვით სტანდარტული ვარიანტი ყველაფერს ფარავს. დავიწყოთ ამით, თუ გაფართოებული გირჩევნიათ?
AVOID: ჰოდა... რას ფიქრობთ? იქნებ როდისმე შემატყობინოთ?
> თუ არ იკითხავ, პასუხი ყოველთვის „არა“-ა.`) },
      { title: t("Always leave with a next step", "ყოველთვის დატოვე შემდეგი ნაბიჯი"),
        body: t(`Not every call ends in a sale. Every call should end with a clear next step.
## A real next step has
- A specific action (meeting, demo, call, decision).
- A date and time.
- Agreement from the customer, not just from you.
## After the call
Send a short message the same day: what you agreed, and the next date.
SAY: Let's speak again on Thursday at 11 to finalise. Does that work for you?
AVOID: I'll call you in a few days. (no date, no agreement)
> "I'll call you sometime" is not a next step. A date in both calendars is.`,
          `ყოველი ზარი გაყიდვით არ მთავრდება. ყოველი ზარი მკაფიო შემდეგი ნაბიჯით უნდა დასრულდეს.
## ნამდვილ შემდეგ ნაბიჯს აქვს
- კონკრეტული მოქმედება (შეხვედრა, დემო, ზარი, გადაწყვეტილება).
- თარიღი და საათი.
- მომხმარებლის თანხმობა და არა მხოლოდ შენი.
## ზარის შემდეგ
იმავე დღეს გაუგზავნე მოკლე მესიჯი: რაზე შეთანხმდით და შემდეგი თარიღი.
SAY: ხუთშაბათს 11-ზე ისევ ვისაუბროთ და დავასრულოთ. გაწყობთ?
AVOID: რამდენიმე დღეში დაგირეკავთ. (თარიღის და თანხმობის გარეშე)
> „როდისმე დაგირეკავ“ შემდეგი ნაბიჯი არ არის. თარიღი ორივეს კალენდარში — აი ეს არის.`) },
    ],
    quiz: [
      q(t("Which is a buying signal?", "რომელია ყიდვის ნიშანი?"),
        [t("A question about the start date or payment", "კითხვა დაწყების თარიღზე ან გადახდაზე"), t("Silence and short answers", "სიჩუმე და მოკლე პასუხები"), t("'I'm busy now'", "„ახლა დაკავებული ვარ“")], 0),
      q(t("What should you do after a clear buying signal?", "რა უნდა გააკეთო მკაფიო ყიდვის ნიშნის შემდეგ?"),
        [t("Present more features", "მეტი ფუნქცია წარადგინო"), t("Stop presenting and move to the next step", "შეწყვიტო პრეზენტაცია და შემდეგ ნაბიჯზე გადახვიდე"), t("Offer a discount", "ფასდაკლება შესთავაზო")], 1),
      q(t("Why offer two options when closing?", "რატომ უნდა შესთავაზო ორი ვარიანტი დახურვისას?"),
        [t("Choosing between two is easier than yes/no", "ორს შორის არჩევა უფრო ადვილია, ვიდრე კი/არა"), t("To confuse the customer", "მომხმარებლის დასაბნევად"), t("So the call takes longer", "რომ ზარი გაგრძელდეს")], 0),
      q(t("Which is a real next step?", "რომელია ნამდვილი შემდეგი ნაბიჯი?"),
        [t("'I'll call you in a few days'", "„რამდენიმე დღეში დაგირეკავთ“"), t("'Let me know when you're ready'", "„შემატყობინეთ, როცა მზად იქნებით“"), t("'Thursday at 11, agreed?'", "„ხუთშაბათს 11-ზე, შევთანხმდით?“")], 2),
      q(t("What should you send after the call?", "რა უნდა გაუგზავნო ზარის შემდეგ?"),
        [t("A long brochure", "გრძელი ბროშურა"), t("A short message with what you agreed and the next date", "მოკლე მესიჯი შეთანხმებით და შემდეგი თარიღით"), t("Nothing", "არაფერი")], 1),
    ],
  },

  "cold-calling": {
    title: t("Cold calls that work", "ცივი ზარები"), min: 35,
    desc: t("Call people who don't expect you: research in two minutes, an opener that earns 30 seconds, and how to handle the brush-off.",
      "დაურეკე ადამიანებს, რომლებიც შენს ზარს არ ელიან: კვლევა ორ წუთში, დასაწყისი, რომელიც 30 წამს მოგცემს, და როგორ უპასუხო უარს."),
    lessons: [
      { title: t("Two minutes of research", "ორწუთიანი კვლევა"),
        body: t(`A cold call isn't random. Two minutes of preparation turns it into a relevant call.
## Before you dial, find
- One fact about the person or company (new location, growth, a post, a change).
- A likely problem people like them have.
- One result you've delivered for someone similar.
## Pick your goal
The goal of a cold call is not the sale. It's a next step: a meeting, a demo, a second call.
> Relevant beats clever. One real reason to call is worth more than the perfect script.`,
          `ცივი ზარი შემთხვევითი არ არის. ორწუთიანი მზადება მას შესაბამის ზარად აქცევს.
## სანამ დარეკავ, იპოვე
- ერთი ფაქტი ადამიანზე ან კომპანიაზე (ახალი ფილიალი, ზრდა, პოსტი, ცვლილება).
- სავარაუდო პრობლემა, რომელიც მისნაირ ადამიანებს აქვთ.
- ერთი შედეგი, რომელიც მსგავს ვინმეს მიაღწევინე.
## აირჩიე მიზანი
ცივი ზარის მიზანი გაყიდვა არ არის. მიზანი შემდეგი ნაბიჯია: შეხვედრა, დემო, მეორე ზარი.
> შესაბამისობა ჭკვიანურობას სჯობს. ერთი ნამდვილი მიზეზი სრულყოფილ სკრიპტზე მეტი ღირს.`) },
      { title: t("The first 10 seconds", "პირველი 10 წამი"),
        body: t(`On a cold call the first 10 seconds decide everything. The customer is busy and didn't expect you.
## The permission opener
- Say who you are.
- Say why you're calling them specifically.
- Ask for 30 seconds, and offer an easy way out.
SAY: Hi, this is Luka. I'm calling because you recently opened a new location. Can I take 30 seconds, and if it's not relevant we'll hang up?
AVOID: Hello sir, I'm calling from the best company in the market with an amazing offer!
## Then a value hypothesis
SAY: Companies like yours often struggle with X. We help with Y. Is that something you're dealing with?
> Asking permission lowers resistance. Giving them an exit makes them more likely to stay.`,
          `ცივ ზარში პირველი 10 წამი ყველაფერს წყვეტს. მომხმარებელი დაკავებულია და შენს ზარს არ ელოდა.
## ნებართვის დასაწყისი
- თქვი, ვინ ხარ.
- თქვი, რატომ ურეკავ სწორედ მას.
- ითხოვე 30 წამი და მიეცი გასვლის მარტივი გზა.
SAY: გამარჯობა, ლუკა ვარ. გირეკავთ, რადგან ახლახან ახალი ფილიალი გახსენით. შეიძლება 30 წამი, და თუ არ დაგაინტერესებთ, დავასრულოთ?
AVOID: გამარჯობა ბატონო, გირეკავთ ბაზარზე საუკეთესო კომპანიიდან საოცარი შეთავაზებით!
## მერე ღირებულების ჰიპოთეზა
SAY: თქვენნაირ კომპანიებს ხშირად X პრობლემა აქვთ. ჩვენ Y-ში ვეხმარებით. თქვენც გაქვთ ეს?
> ნებართვის თხოვნა წინააღმდეგობას ამცირებს. თუ გასასვლელს მისცემ, უფრო დიდი შანსია, რომ დარჩეს.`) },
      { title: t("Handling the brush-off", "როგორ უპასუხო უარს"),
        body: t(`Most cold calls start with a brush-off. It's a reflex, not a final answer.
## Common brush-offs and answers
SAY: (to "I'm busy") Totally understand. Is later today or tomorrow morning better for two minutes?
SAY: (to "Not interested") Fair enough. Just so I know, is it because you already have a solution, or it's not a priority now?
SAY: (to "Send an email") Sure. One question so it's useful: what's your biggest headache with this right now?
AVOID: Please, just one minute, it's really important!
## Keep score
Rejection is part of the numbers. Track calls, conversations and meetings, not how you felt.
> A calm, curious reply to a brush-off turns about one in five into a conversation.`,
          `ცივი ზარების უმეტესობა უარით იწყება. ეს რეფლექსია და არა საბოლოო პასუხი.
## გავრცელებული უარები და პასუხები
SAY: („დაკავებული ვარ“-ზე) სრულიად გასაგებია. დღეს მოგვიანებით ჯობია თუ ხვალ დილით, ორი წუთით?
SAY: („არ მაინტერესებს“-ზე) სამართლიანია. უბრალოდ რომ ვიცოდე: უკვე გაქვთ გადაწყვეტა, თუ ახლა პრიორიტეტი არ არის?
SAY: („მეილი გამომიგზავნეთ“-ზე) რა თქმა უნდა. ერთი კითხვა, რომ სასარგებლო იყოს: ამ მხრივ ახლა ყველაზე დიდი თავის ტკივილი რა არის?
AVOID: გთხოვთ, სულ ერთი წუთი, ძალიან მნიშვნელოვანია!
## ითვალე ციფრები
უარი ციფრების ნაწილია. ითვალე ზარები, საუბრები და შეხვედრები და არა ის, როგორ გრძნობდი თავს.
> მშვიდი, ცნობისმოყვარე პასუხი უარზე დაახლოებით ყოველ მეხუთეს საუბრად აქცევს.`) },
    ],
    quiz: [
      q(t("What is the goal of a cold call?", "რა არის ცივი ზარის მიზანი?"),
        [t("Close the sale on the spot", "იქვე გაყიდვა"), t("A next step: meeting, demo or call", "შემდეგი ნაბიჯი: შეხვედრა, დემო ან ზარი"), t("Explain every feature", "ყველა ფუნქციის ახსნა")], 1),
      q(t("What lowers resistance at the start of a cold call?", "რა ამცირებს წინააღმდეგობას ცივი ზარის დასაწყისში?"),
        [t("Asking permission for a short amount of time", "მოკლე დროის ნებართვის თხოვნა"), t("Talking fast so they can't interrupt", "სწრაფი ლაპარაკი, რომ ვერ შეგაწყვეტინონ"), t("Stating the price first", "ფასის პირველივე თქმა")], 0),
      q(t("What should you find before dialling?", "რა უნდა იპოვო დარეკვამდე?"),
        [t("Their home address", "მათი სახლის მისამართი"), t("Nothing, just call", "არაფერი, უბრალოდ დარეკე"), t("One relevant fact and a likely problem", "ერთი შესაბამისი ფაქტი და სავარაუდო პრობლემა")], 2),
      q(t("The customer says 'Not interested'. Best reply?", "მომხმარებელი ამბობს „არ მაინტერესებს“. საუკეთესო პასუხი?"),
        [t("Ask calmly whether they have a solution or it's not a priority", "მშვიდად ჰკითხო, გადაწყვეტა აქვთ თუ ახლა პრიორიტეტი არ არის"), t("Beg for one more minute", "კიდევ ერთი წუთი სთხოვო"), t("Hang up immediately", "მაშინვე გათიშო")], 0),
      q(t("What should you track to improve at cold calling?", "რა უნდა ითვალო ცივ ზარებში გასაუმჯობესებლად?"),
        [t("How you felt after each call", "როგორ გრძნობდი თავს ყოველი ზარის შემდეგ"), t("Calls, conversations and meetings booked", "ზარები, საუბრები და დანიშნული შეხვედრები"), t("Only sales", "მხოლოდ გაყიდვები")], 1),
    ],
  },

  "follow-up": {
    title: t("Follow-ups and referrals", "Follow-up და რეკომენდაციები"), min: 35,
    desc: t("Most deals close after several contacts: a follow-up rhythm that adds value each time, and how to turn happy customers into referrals.",
      "გარიგებების უმეტესობა რამდენიმე კონტაქტის შემდეგ იხურება: follow-up-ის რიტმი, რომელიც ყოველ ჯერზე ღირებულებას ამატებს, და როგორ აქციო კმაყოფილი კლიენტები რეკომენდაციებად."),
    lessons: [
      { title: t("The fortune is in the follow-up", "ფული follow-up-შია"),
        body: t(`Most deals don't close on the first contact. They close on the 2nd to 5th, and most sellers give up after one.
## Why customers go quiet
- They're busy, not uninterested.
- It's not urgent for them yet.
- They need to ask someone else.
## A simple rhythm
- Day 1: summary message after the call.
- Day 3: something useful (an example, an answer, an idea).
- Day 7: a short check-in with a clear question.
- Day 14: a polite "should I close your file?" message.
> Persistence wins only when every touch adds something.`,
          `გარიგებების უმეტესობა პირველ კონტაქტზე არ იხურება. ისინი მე-2–5 კონტაქტზე იხურება, გამყიდველების უმეტესობა კი ერთის მერე ნებდება.
## რატომ ჩუმდებიან მომხმარებლები
- დაკავებულები არიან და არა დაუინტერესებლები.
- მათთვის ჯერ სასწრაფო არ არის.
- სხვისი აზრი უნდა იკითხონ.
## მარტივი რიტმი
- დღე 1: შეჯამების მესიჯი ზარის შემდეგ.
- დღე 3: რაღაც სასარგებლო (მაგალითი, პასუხი, იდეა).
- დღე 7: მოკლე შეხსენება მკაფიო კითხვით.
- დღე 14: თავაზიანი „დავხურო თქვენი საკითხი?“ მესიჯი.
> დაჟინება მხოლოდ მაშინ იგებს, როცა ყოველი კონტაქტი რაღაცას ამატებს.`) },
      { title: t("Follow-ups that add value", "follow-up, რომელიც ღირებულებას ამატებს"),
        body: t(`A follow-up should be worth opening. "Just checking in" is not.
## Give them a reason to reply
- Answer a question they asked on the call.
- Share a short example of a similar customer.
- Send one idea that helps, even if they don't buy.
## Keep it short
Three or four lines, one question at the end.
SAY: Hi Ana, you asked how long setup takes; for a client like you it was 3 days. Would Tuesday work to walk through it?
AVOID: Hi, just checking in to see if you had any thoughts on my previous email.
> Every message should answer: why would they be glad they read this?`,
          `follow-up გახსნის ღირსი უნდა იყოს. „უბრალოდ გამოგეხმაურეთ“ არ არის.
## მიეცი პასუხის მიზეზი
- უპასუხე კითხვას, რომელიც ზარზე დასვა.
- გაუზიარე მსგავსი კლიენტის მოკლე მაგალითი.
- გაუგზავნე ერთი იდეა, რომელიც დაეხმარება, თუნდაც არ იყიდოს.
## იყავი მოკლე
სამი-ოთხი ხაზი, ბოლოს ერთი კითხვა.
SAY: გამარჯობა ანა, მკითხეთ, რამდენ ხანს გრძელდება გაშვება; თქვენნაირ კლიენტთან 3 დღე დასჭირდა. სამშაბათი გაწყობთ, რომ ერთად გავიაროთ?
AVOID: გამარჯობა, უბრალოდ გამოგეხმაურეთ, ხომ არ გაქვთ რაიმე აზრი ჩემს წინა წერილზე.
> ყოველმა მესიჯმა უნდა უპასუხოს: რატომ გაუხარდება, რომ წაიკითხა?`) },
      { title: t("Asking for referrals", "რეკომენდაციის თხოვნა"),
        body: t(`A warm introduction from a happy customer is the easiest sale you'll ever make.
## When to ask
Right after a win: they just got a result, said thanks, or praised you.
## How to ask
Ask for one specific name, not "anyone you know".
SAY: I'm glad it worked out. Who do you know who could use this too? Even one name helps.
SAY: Would you be comfortable introducing us by message?
AVOID: If you ever hear of anybody, let me know. (vague, nobody remembers)
## Close the loop
Tell the referrer what happened. People introduce again when they see it helped.
> Ask for one name, at the happiest moment, and always say thank you.`,
          `კმაყოფილი კლიენტის „თბილი“ გაცნობა ყველაზე მარტივი გაყიდვაა.
## როდის ითხოვო
გამარჯვების მერე: როცა შედეგი მიიღო, მადლობა გითხრა ან შეგაქო.
## როგორ ითხოვო
ითხოვე ერთი კონკრეტული სახელი და არა „ვინმე, ვისაც იცნობთ“.
SAY: მიხარია, რომ გამოვიდა. ვის იცნობთ, ვისაც ეს ასევე გამოადგება? ერთი სახელიც კი დამეხმარება.
SAY: მოგიხერხდებათ მესიჯით რომ გაგვაცნოთ?
AVOID: თუ ოდესმე ვინმეზე გაიგებთ, შემატყობინეთ. (ბუნდოვანია, არავის ახსოვს)
## დახურე წრე
უთხარი რეკომენდატორს, რა მოხდა. ადამიანები კვლავ გაცნობენ, როცა ხედავენ, რომ დაეხმარა.
> ითხოვე ერთი სახელი, ყველაზე ბედნიერ მომენტში, და ყოველთვის თქვი მადლობა.`) },
    ],
    quiz: [
      q(t("On which contact do most deals close?", "მერამდენე კონტაქტზე იხურება გარიგებების უმეტესობა?"),
        [t("The first", "პირველზე"), t("The 2nd to 5th", "მე-2–5-ზე"), t("After 20", "20-ის შემდეგ")], 1),
      q(t("Which follow-up is weakest?", "რომელია ყველაზე სუსტი follow-up?"),
        [t("'Just checking in on my last email'", "„უბრალოდ გამოგეხმაურეთ წინა წერილზე“"), t("An answer to their question plus a date", "პასუხი მის კითხვაზე და თარიღი"), t("A short example of a similar customer", "მსგავსი კლიენტის მოკლე მაგალითი")], 0),
      q(t("When is the best time to ask for a referral?", "როდის არის საუკეთესო დრო რეკომენდაციის სათხოვნელად?"),
        [t("On the first call", "პირველ ზარზე"), t("When they complain", "როცა უჩივიან"), t("Right after they got a result or thanked you", "მაშინვე, როცა შედეგი მიიღეს ან მადლობა გითხრეს")], 2),
      q(t("How should you ask for a referral?", "როგორ უნდა ითხოვო რეკომენდაცია?"),
        [t("Ask for one specific name", "ითხოვე ერთი კონკრეტული სახელი"), t("'Let me know if you hear of anybody'", "„შემატყობინეთ, თუ ვინმეზე გაიგებთ“"), t("Ask for their whole contact list", "ითხოვე მთელი კონტაქტების სია")], 0),
      q(t("Why tell the referrer what happened?", "რატომ უნდა უთხრა რეკომენდატორს, რა მოხდა?"),
        [t("It's required", "სავალდებულოა"), t("People introduce again when they see it helped", "ადამიანები კვლავ გაცნობენ, როცა ხედავენ, რომ დაეხმარა"), t("To ask for money", "ფულის სათხოვნელად")], 1),
    ],
  },

  negotiation: {
    title: t("Negotiating on price", "ფასზე მოლაპარაკება"), min: 40,
    desc: t("Defend your price with value, trade every concession for something, and know your walk-away point before the conversation starts.",
      "დაიცავი ფასი ღირებულებით, ყოველი დათმობა რაღაცაში გაცვალე და იცოდე შენი ზღვარი, სანამ საუბარი დაიწყება."),
    lessons: [
      { title: t("'Expensive' means 'not enough value yet'", "„ძვირი“ ნიშნავს „ჯერ საკმარისი ღირებულება არ ჩანს“"),
        body: t(`When a customer says the price is too high, they rarely mean they can't pay. They mean the value isn't clear enough yet.
## Go back to value first
- Remind them of the problem in their words.
- Put a number on what it costs them to do nothing.
- Compare the price to that cost, not to a competitor's discount.
SAY: You mentioned this costs you about two days a month. What's that worth to you?
AVOID: OK, I can do 15% off. (discount before value)
> Never defend a price you haven't explained. Value first, numbers second.`,
          `როცა მომხმარებელი ამბობს, რომ ფასი მაღალია, იშვიათად გულისხმობს, რომ ვერ გადაიხდის. გულისხმობს, რომ ღირებულება ჯერ საკმარისად ნათელი არ არის.
## ჯერ ღირებულებას დაუბრუნდი
- შეახსენე პრობლემა მისივე სიტყვებით.
- დაადე ციფრი იმას, რა უჯდება უმოქმედობა.
- შეადარე ფასი ამ ხარჯს და არა კონკურენტის ფასდაკლებას.
SAY: თქვით, რომ ეს თვეში დაახლოებით ორ დღეს გიჯდებათ. რამდენი ღირს ეს თქვენთვის?
AVOID: კარგი, 15%-ს დაგიკლებთ. (ფასდაკლება ღირებულებამდე)
> ნუ დაიცავ ფასს, რომელიც არ აგიხსნია. ჯერ ღირებულება, მერე ციფრები.`) },
      { title: t("Trade, don't give", "გაცვალე და ნუ გასცემ"),
        body: t(`If you give a discount for free, you teach the customer that pushing works, and they push again.
## Every concession needs something back
- A longer contract.
- Payment upfront.
- A bigger order or more people.
- A referral or a testimonial.
## Make concessions smaller each time
Big, then smaller, then tiny tells them you're near your limit.
SAY: If you can commit to a year instead of a month, I can adjust the price. Would that work?
AVOID: Fine, 10%. ... OK, 20%. ... Let's say 25%.
> "If you…, then I…" is the most useful sentence in a negotiation.`,
          `თუ ფასდაკლებას უფასოდ გასცემ, მომხმარებელს ასწავლი, რომ ზეწოლა მუშაობს, და ისევ დაგაწვება.
## ყოველ დათმობას სანაცვლო სჭირდება
- უფრო გრძელი კონტრაქტი.
- წინასწარი გადახდა.
- უფრო დიდი შეკვეთა ან მეტი ადამიანი.
- რეკომენდაცია ან შეფასება.
## ყოველი დათმობა წინაზე პატარა იყოს
დიდი, მერე პატარა, მერე სულ მცირე — ეს ანიშნებს, რომ ზღვართან ხარ.
SAY: თუ თვის ნაცვლად წლით დადებთ, ფასს შევცვლი. ასე გაწყობთ?
AVOID: კარგი, 10%. ... ჰო, 20%. ... მოდი 25% იყოს.
> „თუ თქვენ…, მაშინ მე…“ მოლაპარაკების ყველაზე სასარგებლო წინადადებაა.`) },
      { title: t("Know your limits before you start", "იცოდე შენი ზღვრები დაწყებამდე"),
        body: t(`The worst time to decide your limit is in the middle of a negotiation.
## Prepare three numbers
- Your ideal price.
- Your realistic target.
- Your walk-away point: below this, no deal.
## Know your alternative
If this deal doesn't happen, what will you do? A good alternative gives you calm, and calm gives you power.
## Silence is a tool
After you state a price or an offer, stop talking. The first one to fill the silence usually concedes.
SAY: That's the best I can do for this scope. (then pause)
AVOID: ...but if that's too much, I could maybe go lower, let me check...
> Decide your walk-away point before the call, and respect it.`,
          `ზღვრის განსაზღვრის ყველაზე ცუდი დრო მოლაპარაკების შუაგულია.
## მოამზადე სამი ციფრი
- იდეალური ფასი.
- რეალისტური მიზანი.
- ზღვარი: ამაზე დაბლა გარიგება არ შედგება.
## იცოდე შენი ალტერნატივა
თუ ეს გარიგება არ შედგება, რას გააკეთებ? კარგი ალტერნატივა სიმშვიდეს გაძლევს, სიმშვიდე კი ძალას.
## სიჩუმე ხელსაწყოა
ფასის ან შეთავაზების თქმის მერე გაჩუმდი. ვინც პირველი შეავსებს სიჩუმეს, ჩვეულებრივ ის თმობს.
SAY: ამ მოცულობისთვის ეს საუკეთესოა, რისი გაკეთებაც შემიძლია. (და პაუზა)
AVOID: ...მაგრამ თუ ბევრია, იქნებ დავწიო, გადავამოწმებ...
> ზღვარი ზარამდე გადაწყვიტე და დაიცავი.`) },
    ],
    quiz: [
      q(t("The customer asks for a discount. Best response?", "მომხმარებელი ფასდაკლებას ითხოვს. საუკეთესო პასუხი?"),
        [t("Give 10% right away", "მაშინვე 10%-ის დათმობა"), t("Refuse and end the call", "უარი და ზარის დასრულება"), t("Concede only in exchange for something", "დათმობა მხოლოდ რაღაცის სანაცვლოდ")], 2),
      q(t("'It's expensive' usually means…", "„ძვირია“ ჩვეულებრივ ნიშნავს…"),
        [t("The value isn't clear yet", "ღირებულება ჯერ ნათელი არ არის"), t("They have no money", "ფული არ აქვთ"), t("They want to end the call", "ზარის დასრულება უნდათ")], 0),
      q(t("How should concessions change over time?", "როგორ უნდა იცვლებოდეს დათმობები დროთა განმავლობაში?"),
        [t("Get bigger", "იზრდებოდეს"), t("Get smaller", "პატარავდებოდეს"), t("Stay the same", "ერთნაირი იყოს")], 1),
      q(t("What is a walk-away point?", "რა არის ზღვარი (walk-away point)?"),
        [t("The price below which there's no deal", "ფასი, რომელზე დაბლაც გარიგება არ შედგება"), t("Your ideal price", "შენი იდეალური ფასი"), t("The competitor's price", "კონკურენტის ფასი")], 0),
      q(t("What should you do right after stating your price?", "რა უნდა გააკეთო ფასის თქმისთანავე?"),
        [t("Explain you could go lower", "აუხსნა, რომ შეიძლება დაწიო"), t("Ask if it's too much", "ჰკითხო, ბევრი ხომ არ არის"), t("Stay silent and let them answer", "გაჩუმდე და მისცე პასუხის საშუალება")], 2),
    ],
  },
};

// Lessons + quiz + practice call for one profession; {product} gets the profession's own product.
export function coreLessons(key: string, product: { en: string; ka: string }, scenarioId: string | undefined) {
  const c = CORE[key];
  const fill = (s: string, lang: "en" | "ka") => s.replaceAll("{product}", product[lang]);
  return [
    ...c.lessons.map((l, i) => ({ type: "TEXT" as const, order: i, xpReward: 10, titleKa: l.title.ka, titleEn: l.title.en, contentKa: fill(l.body.ka, "ka"), contentEn: fill(l.body.en, "en") })),
    { type: "QUIZ" as const, order: c.lessons.length, xpReward: 25, titleKa: "ქვიზი", titleEn: "Quiz",
      questions: { create: c.quiz.map((x) => ({ questionKa: x.q.ka, questionEn: x.q.en, options: x.o, correctIndex: x.c })) } },
    { type: "CALL" as const, order: c.lessons.length + 1, xpReward: 25, titleKa: "პრაქტიკული ზარი", titleEn: "Practice call",
      contentKa: "გამოიყენე ნასწავლი რეალურ ზარში.", contentEn: "Use what you learned on a real call.", scenarioId },
  ];
}
