import { PrismaClient, Difficulty, LessonType } from "@prisma/client";

const db = new PrismaClient();

type P = {
  slug: string; icon: string; ka: string; en: string; dKa: string; dEn: string;
  productKa: string; productEn: string; names: [string, string, string];
};

const professions: P[] = [
  { slug: "real-estate", icon: "🏠", ka: "უძრავი ქონების აგენტი", en: "Real estate agent", dKa: "ბინების და სახლების გაყიდვა და გაქირავება.", dEn: "Selling and renting apartments and houses.", productKa: "ოროთახიანი ბინა ვაკეში", productEn: "a two-bedroom apartment in Vake", names: ["ნინო", "გიორგი", "თამარ"] },
  { slug: "car-sales", icon: "🚗", ka: "ავტომობილების გაყიდვა", en: "Car sales", dKa: "ახალი და მეორადი ავტომობილების გაყიდვა.", dEn: "Selling new and used cars.", productKa: "ჰიბრიდული კროსოვერი", productEn: "a hybrid crossover", names: ["ლევანი", "ანა", "დავითი"] },
  { slug: "insurance", icon: "🛡️", ka: "სადაზღვევო აგენტი", en: "Insurance agent", dKa: "ჯანმრთელობის, სიცოცხლის და ქონების დაზღვევა.", dEn: "Health, life and property insurance.", productKa: "ოჯახის ჯანმრთელობის დაზღვევა", productEn: "a family health insurance plan", names: ["მარიამ", "ზურაბი", "ეკა"] },
  { slug: "b2b-saas", icon: "💻", ka: "პროგრამული უზრუნველყოფის გაყიდვა", en: "B2B SaaS / software sales", dKa: "პროგრამების გაყიდვა კომპანიებისთვის.", dEn: "Selling software to businesses.", productKa: "CRM სისტემა გაყიდვების გუნდისთვის", productEn: "a CRM for sales teams", names: ["ირაკლი", "სოფო", "ნიკა"] },
  { slug: "retail", icon: "🛍️", ka: "საცალო ვაჭრობა", en: "Retail & e-commerce", dKa: "მაღაზიაში და ონლაინ გაყიდვები.", dEn: "In-store and online sales.", productKa: "პრემიუმ ლეპტოპი", productEn: "a premium laptop", names: ["ქეთი", "ლუკა", "ნათია"] },
  { slug: "banking", icon: "🏦", ka: "საბანკო პროდუქტები", en: "Banking & finance products", dKa: "სესხები, ბარათები და ანაბრები.", dEn: "Loans, cards and deposits.", productKa: "იპოთეკური სესხი", productEn: "a mortgage loan", names: ["ბექა", "ლიკა", "გოგა"] },
  { slug: "freelancer", icon: "🎨", ka: "ფრილანსერი", en: "Freelancer selling own services", dKa: "საკუთარი სერვისების გაყიდვა კლიენტებზე.", dEn: "Selling your own services to clients.", productKa: "ვებსაიტის დიზაინი და აწყობა", productEn: "website design and development", names: ["ელენე", "საბა", "მაკა"] },
  { slug: "hospitality", icon: "🍽️", ka: "რესტორანი და სტუმართმოყვარეობა", en: "Restaurant & hospitality", dKa: "ღონისძიებები, ბანკეტები და სასტუმრო.", dEn: "Events, banquets and hotel stays.", productKa: "საქორწილო ბანკეტის პაკეტი", productEn: "a wedding banquet package", names: ["ხატია", "რატი", "ნანა"] },
  { slug: "startup-pitch", icon: "🚀", ka: "სტარტაპის პიჩი ინვესტორთან", en: "Startup founder pitching investors", dKa: "ინვესტიციის მოზიდვა სტარტაპისთვის.", dEn: "Raising investment for a startup.", productKa: "სტარტაპის 15%-იანი წილი", productEn: "a 15% stake in your startup", names: ["ალექსი", "თეა", "გურამი"] },
  { slug: "my-product", icon: "✨", ka: "ჩემი საკუთარი პროდუქტი", en: "My own product", dKa: "აღწერე შენი პროდუქტი და AI შექმნის შენს მომხმარებელს.", dEn: "Describe your product and the AI builds your customer.", productKa: "მომხმარებლის მიერ აღწერილი პროდუქტი", productEn: "the product the user describes", names: ["ნინი", "ბაჩო", "ია"] },
];

const personas = [
  { d: Difficulty.EASY, lvl: 1, pro: false, tKa: "დაინტერესებული მომხმარებელი", tEn: "Interested customer",
    ka: "ხარ თბილი და დაინტერესებული, მაგრამ გინდა დეტალები გაიგო. ბიუჯეტი საშუალოა. ერთი წინააღმდეგობა: „ცოტა ძვირია“. იყიდი, თუ გამყიდველი ღირებულებას კარგად აგიხსნის.",
    en: "You are warm and interested but want details. Medium budget. One objection: 'it's a bit expensive'. You buy if the seller explains the value well." },
  { d: Difficulty.NORMAL, lvl: 2, pro: false, tKa: "დაკავებული მომხმარებელი", tEn: "Busy customer",
    ka: "ძალიან დაკავებული ხარ და მხოლოდ 2 წუთი გაქვს. მოკლე პასუხებს იძლევი. ფარული წინააღმდეგობა: უკვე იყენებ კონკურენტს. იყიდი მხოლოდ თუ გამყიდველი შენს რეალურ პრობლემას იპოვის კითხვებით.",
    en: "You are very busy and have only 2 minutes. You give short answers. Hidden objection: you already use a competitor. You buy only if the seller uncovers your real problem through questions." },
  { d: Difficulty.HARD, lvl: 4, pro: true, tKa: "სკეპტიკური მომხმარებელი", tEn: "Skeptical customer",
    ka: "სკეპტიკური ხარ, ფასზე მგრძნობიარე და ცუდი გამოცდილება გქონდა მსგავს პროდუქტთან. გაქვს 3 წინააღმდეგობა: ფასი, ნდობა, „ვიფიქრებ“. იყიდი მხოლოდ თუ სამივეს დამაჯერებლად უპასუხებს და კონკრეტულ შემდეგ ნაბიჯს შემოგთავაზებს.",
    en: "You are skeptical, price-sensitive and had a bad experience with a similar product. You have 3 objections: price, trust, 'I'll think about it'. You buy only if all three are answered convincingly and the seller proposes a concrete next step." },
];

const courses = [
  { key: "opening", free: true, lvl: 1, ka: "პირველი 30 წამი", en: "The first 30 seconds",
    bodyKa: "კარგი დასაწყისი სამი რამისგან შედგება: მოკლე წარდგენა, ზარის მიზეზი და კითხვა, რომელიც მომხმარებელს ალაპარაკებს. ნუ დაიწყებ პროდუქტის აღწერით — დაიწყე მომხმარებლით.",
    bodyEn: "A strong opening has three parts: a short introduction, the reason for the call, and a question that gets the customer talking. Don't start with your product — start with the customer." },
  { key: "discovery", free: true, lvl: 1, ka: "სწორი კითხვები", en: "Discovery questions",
    bodyKa: "ღია კითხვები („როგორ“, „რატომ“, „რა“) გეხმარება გაიგო მომხმარებლის რეალური პრობლემა. მოუსმინე მეტს, ვიდრე ლაპარაკობ — 70/30 წესი.",
    bodyEn: "Open questions ('how', 'why', 'what') help you uncover the customer's real problem. Listen more than you talk — the 70/30 rule." },
  { key: "objections", free: false, lvl: 2, ka: "წინააღმდეგობების დაძლევა", en: "Handling objections",
    bodyKa: "წინააღმდეგობა ინტერესის ნიშანია. გამოიყენე LAER: მოუსმინე (Listen), აღიარე (Acknowledge), გამოიკვლიე (Explore), უპასუხე (Respond).",
    bodyEn: "An objection is a sign of interest. Use LAER: Listen, Acknowledge, Explore, Respond." },
  { key: "closing", free: false, lvl: 3, ka: "გარიგების დახურვა", en: "Closing the deal",
    bodyKa: "დახურვა არ არის ზეწოლა — ეს ბუნებრივი შემდეგი ნაბიჯია. შესთავაზე ორი არჩევანი, შეაჯამე ღირებულება და პირდაპირ იკითხე.",
    bodyEn: "Closing isn't pressure — it's the natural next step. Offer two options, summarise the value, and ask directly." },
];

// Added later: created for every profession only if missing, so re-running the seed is safe on a live DB.
const moreCourses = [
  { key: "cold-calling", free: true, lvl: 1, min: 25, ka: "ცივი ზარები", en: "Cold calls that work",
    bodyKa: "ცივ ზარში პირველი 10 წამი წყვეტს ყველაფერს. თქვი ვინ ხარ, რატომ რეკავ ამ კონკრეტულ ადამიანთან და ითხოვე 30 წამი: „შეიძლება 30 წამი, და თუ არ დაგაინტერესებთ, დავასრულოთ?“. ნებართვა ამცირებს წინააღმდეგობას.",
    bodyEn: "On a cold call the first 10 seconds decide everything. Say who you are, why you are calling this specific person, and ask for 30 seconds: 'Can I take 30 seconds, and if it's not relevant we'll hang up?'. Asking permission lowers resistance.",
    q: { ka: "რა ამცირებს წინააღმდეგობას ცივი ზარის დასაწყისში?", en: "What lowers resistance at the start of a cold call?",
      options: [{ ka: "მოკლე დროის ნებართვის თხოვნა", en: "Asking permission for a short amount of time" }, { ka: "სწრაფად ლაპარაკი, რომ არ გაგაწყვეტინონ", en: "Talking fast so they can't interrupt" }, { ka: "ფასის პირველივე წინადადებაში თქმა", en: "Stating the price in the first sentence" }], correct: 0 } },
  { key: "follow-up", free: false, lvl: 2, min: 30, ka: "Follow-up და რეკომენდაციები", en: "Follow-ups and referrals",
    bodyKa: "გარიგებების უმეტესობა მე-2–5 კონტაქტზე იხურება. ყოველ ზარს დაასრულე კონკრეტული შემდეგი ნაბიჯით (დღე და საათი). კმაყოფილ მომხმარებელს სთხოვე ერთი სახელი: „ვის იცნობთ, ვისაც ეს ასევე გამოადგება?“.",
    bodyEn: "Most deals close on the 2nd to 5th contact. End every call with a concrete next step (day and time). Ask happy customers for one name: 'Who do you know who could use this too?'.",
    q: { ka: "როგორ უნდა დასრულდეს ყოველი ზარი?", en: "How should every call end?",
      options: [{ ka: "„დაგირეკავთ რამდენიმე დღეში“", en: "'I'll call you in a few days'" }, { ka: "კონკრეტული შემდეგი ნაბიჯით: დღე და საათი", en: "With a concrete next step: day and time" }, { ka: "ფასდაკლების შეთავაზებით", en: "With a discount offer" }], correct: 1 } },
  { key: "negotiation", free: false, lvl: 3, min: 35, ka: "ფასზე მოლაპარაკება", en: "Negotiating on price",
    bodyKa: "ფასდაკლებას ნუ მისცემ უფასოდ — ყოველ დათმობაზე ითხოვე რამე სანაცვლოდ (გრძელი კონტრაქტი, წინასწარი გადახდა, რეკომენდაცია). „ძვირია“ ხშირად ნიშნავს „ღირებულება ვერ დავინახე“ — ჯერ ღირებულებას დაუბრუნდი.",
    bodyEn: "Never give a discount for free: trade every concession for something (a longer contract, upfront payment, a referral). 'It's expensive' often means 'I don't see the value yet', so go back to value first.",
    q: { ka: "მომხმარებელი ფასდაკლებას ითხოვს. საუკეთესო პასუხი?", en: "The customer asks for a discount. Best response?",
      options: [{ ka: "მაშინვე 10%-ის დათმობა", en: "Give 10% right away" }, { ka: "უარი და ზარის დასრულება", en: "Refuse and end the call" }, { ka: "დათმობა მხოლოდ რამის სანაცვლოდ", en: "Concede only in exchange for something" }], correct: 2 } },
];

const quiz = {
  qKa: "რომელია საუკეთესო პირველი ნაბიჯი ზარში?", qEn: "What is the best first step on a call?",
  options: [
    { ka: "პროდუქტის ყველა ფუნქციის ჩამოთვლა", en: "List every product feature" },
    { ka: "მომხმარებლისთვის ღია კითხვის დასმა", en: "Ask the customer an open question" },
    { ka: "ფასდაკლების დაუყოვნებლივ შეთავაზება", en: "Offer a discount immediately" },
  ],
  correct: 1,
};

async function main() {
  await db.badge.createMany({
    skipDuplicates: true,
    data: [
      { id: "FIRST_CALL", titleKa: "პირველი ზარი", titleEn: "First call", icon: "📞" },
      { id: "FIRST_SALE", titleKa: "პირველი გაყიდვა", titleEn: "First sale", icon: "💰" },
      { id: "STREAK_7", titleKa: "7 დღე ზედიზედ", titleEn: "7-day streak", icon: "🔥" },
      { id: "BOSS_CLOSER", titleKa: "ბოსის დამარცხება", titleEn: "Closed a Boss customer", icon: "👑" },
      { id: "COURSE_DONE", titleKa: "კურსი დასრულდა", titleEn: "Course completed", icon: "🎓" },
    ],
  });

  for (const [i, p] of professions.entries()) {
    if (await db.profession.findUnique({ where: { slug: p.slug } })) continue;
    const prof = await db.profession.create({
      data: { slug: p.slug, icon: p.icon, titleKa: p.ka, titleEn: p.en, descriptionKa: p.dKa, descriptionEn: p.dEn, order: i },
    });

    const scenarios = [];
    for (const [j, s] of personas.entries()) {
      scenarios.push(await db.scenario.create({
        data: {
          professionId: prof.id, difficulty: s.d, requiredLevel: s.lvl, isPro: s.pro,
          titleKa: s.tKa, titleEn: s.tEn, customerName: p.names[j],
          personaPromptKa: `შენი სახელია ${p.names[j]}. გამყიდველი გთავაზობს: ${p.productKa}. ${s.ka}`,
          personaPromptEn: `Your name is ${p.names[j]}. The seller is offering you ${p.productEn}. ${s.en}`,
        },
      }));
    }

    for (const [k, c] of courses.entries()) {
      await db.course.create({
        data: {
          slug: `${p.slug}-${c.key}`, professionId: prof.id,
          titleKa: `${c.ka}: ${p.ka}`, titleEn: `${c.en}: ${p.en}`,
          descriptionKa: c.bodyKa, descriptionEn: c.bodyEn,
          durationMin: 20 + k * 10, requiredLevel: c.lvl, isFree: c.free,
          priceGel: c.free ? 0 : 49, priceUsd: c.free ? 0 : 19,
          modules: {
            create: [{
              titleKa: "მთავარი მოდული", titleEn: "Core module", order: 0,
              lessons: {
                create: [
                  { type: LessonType.TEXT, order: 0, xpReward: 10, titleKa: "თეორია", titleEn: "Theory", contentKa: c.bodyKa, contentEn: c.bodyEn },
                  { type: LessonType.QUIZ, order: 1, xpReward: 15, titleKa: "ქვიზი", titleEn: "Quiz",
                    questions: { create: [{ questionKa: quiz.qKa, questionEn: quiz.qEn, options: quiz.options, correctIndex: quiz.correct }] } },
                  { type: LessonType.CALL, order: 2, xpReward: 25, titleKa: "პრაქტიკული ზარი", titleEn: "Practice call",
                    contentKa: "გამოიყენე ნასწავლი რეალურ ზარში.", contentEn: "Use what you learned on a real call.",
                    scenarioId: scenarios[Math.min(k, 2)].id },
                ],
              },
            }],
          },
        },
      });
    }
  }
  for (const p of professions) {
    const prof = await db.profession.findUnique({ where: { slug: p.slug }, include: { scenarios: { orderBy: { requiredLevel: "asc" } } } });
    if (!prof) continue;
    for (const [k, c] of moreCourses.entries()) {
      const slug = `${p.slug}-${c.key}`;
      if (await db.course.findUnique({ where: { slug } })) continue;
      await db.course.create({
        data: {
          slug, professionId: prof.id,
          titleKa: `${c.ka}: ${p.ka}`, titleEn: `${c.en}: ${p.en}`,
          descriptionKa: c.bodyKa, descriptionEn: c.bodyEn,
          durationMin: c.min, requiredLevel: c.lvl, isFree: c.free,
          priceGel: c.free ? 0 : 49, priceUsd: c.free ? 0 : 19,
          modules: {
            create: [{
              titleKa: "მთავარი მოდული", titleEn: "Core module", order: 0,
              lessons: {
                create: [
                  { type: LessonType.TEXT, order: 0, xpReward: 10, titleKa: "თეორია", titleEn: "Theory", contentKa: c.bodyKa, contentEn: c.bodyEn },
                  { type: LessonType.QUIZ, order: 1, xpReward: 15, titleKa: "ქვიზი", titleEn: "Quiz",
                    questions: { create: [{ questionKa: c.q.ka, questionEn: c.q.en, options: c.q.options, correctIndex: c.q.correct }] } },
                  { type: LessonType.CALL, order: 2, xpReward: 25, titleKa: "პრაქტიკული ზარი", titleEn: "Practice call",
                    contentKa: "გამოიყენე ნასწავლი რეალურ ზარში.", contentEn: "Use what you learned on a real call.",
                    scenarioId: prof.scenarios[Math.min(k, prof.scenarios.length - 1)]?.id },
                ],
              },
            }],
          },
        },
      });
    }
  }
  console.log("Seed done");
}

main().finally(() => db.$disconnect());
