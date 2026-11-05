// Well-known public facts about famous sellers and founders, written in our own words.
export type Legend = {
  name: string;
  years: string;
  roleEn: string; roleKa: string;
  startEn: string; startKa: string;
  stepsEn: string[]; stepsKa: string[];
  lessonEn: string; lessonKa: string;
  skill: "opening" | "discovery" | "value" | "objections" | "closing" | "tone";
};

export const LEGENDS: Legend[] = [
  {
    name: "Joe Girard", years: "1928–2019", skill: "closing",
    roleEn: "Car salesman, Guinness record holder", roleKa: "ავტომობილების გამყიდველი, გინესის რეკორდსმენი",
    startEn: "Started selling cars in Detroit in 1963 after his construction business failed and he was deep in debt.",
    startKa: "1963 წელს, მშენებლობის ბიზნესის გაკოტრებისა და დიდი ვალის შემდეგ, დეტროიტში მანქანების გაყიდვა დაიწყო.",
    stepsEn: ["Sold 13,001 cars at one Chevrolet dealership in 15 years, retail and one at a time.", "Mailed every past customer a card every month, so they thought of him first.", "Believed every person knows about 250 others, so one happy or angry customer spreads far."],
    stepsKa: ["15 წელიწადში ერთ დილერშიპში 13 001 მანქანა გაყიდა, ყველა ცალ-ცალკე, საცალოდ.", "ყველა ყოფილ კლიენტს ყოველთვე ბარათს უგზავნიდა, რომ პირველად ის გახსენებოდათ.", "თვლიდა, რომ ყველა ადამიანი დაახლოებით 250 სხვას იცნობს, ამიტომ ერთი კმაყოფილი ან გაბრაზებული კლიენტი ბევრს აღწევს."],
    lessonEn: "The sale is not the end. Follow-up turns one buyer into a stream of referrals.",
    lessonKa: "გაყიდვა დასასრული არ არის. მუდმივი კონტაქტი ერთ მყიდველს რეკომენდაციების ნაკადად აქცევს.",
  },
  {
    name: "Zig Ziglar", years: "1926–2012", skill: "tone",
    roleEn: "Door-to-door salesman, speaker and author", roleKa: "კარდაკარ გამყიდველი, სპიკერი და ავტორი",
    startEn: "Sold cookware door to door in the 1940s and struggled for his first years.",
    startKa: "1940-იან წლებში ჭურჭელს კარდაკარ ყიდდა და პირველ წლებში ძლივს ართმევდა თავს.",
    stepsEn: ["A mentor told him he could be great if he believed in himself, and his results jumped.", "Became one of the top salespeople in a company of thousands.", "Turned what he learned into talks and the book See You at the Top (1975)."],
    stepsKa: ["მენტორმა უთხრა, რომ დიდ წარმატებას მიაღწევდა, თუ თავის თავის რწმენა ექნებოდა, და შედეგები მკვეთრად გაიზარდა.", "ათასობით თანამშრომლიან კომპანიაში ერთ-ერთი საუკეთესო გამყიდველი გახდა.", "ნასწავლი გამოსვლებად და წიგნად See You at the Top (1975) აქცია."],
    lessonEn: "Your attitude is part of the pitch. Help people get what they want and you will get what you want.",
    lessonKa: "შენი განწყობა გაყიდვის ნაწილია. დაეხმარე ხალხს, მიიღონ ის, რაც უნდათ, და შენც მიიღებ შენსას.",
  },
  {
    name: "Mary Kay Ash", years: "1918–2001", skill: "tone",
    roleEn: "Founder of Mary Kay Cosmetics", roleKa: "Mary Kay Cosmetics-ის დამფუძნებელი",
    startEn: "Spent 25 years in direct sales and quit after a man she had trained was promoted over her.",
    startKa: "25 წელი პირდაპირ გაყიდვებში იმუშავა და წავიდა მას შემდეგ, რაც მის მიერ გაწვრთნილი კაცი მასზე მაღლა დააწინაურეს.",
    stepsEn: ["Started her own company in 1963 with $5,000 of savings.", "Built it around recognition: famous rewards like the pink Cadillac for top sellers.", "Grew it into a global company with a huge independent sales force."],
    stepsKa: ["1963 წელს საკუთარი კომპანია 5 000 დოლარის დანაზოგით დააარსა.", "კომპანია აღიარებაზე ააგო: საუკეთესო გამყიდველებს ცნობილ ჯილდოებს, მაგალითად ვარდისფერ Cadillac-ს აძლევდა.", "ის უზარმაზარი დამოუკიდებელი გამყიდველების ქსელის მქონე გლობალურ კომპანიად აქცია."],
    lessonEn: "Make every person feel important, customers and teammates alike.",
    lessonKa: "ყველა ადამიანს აგრძნობინე, რომ მნიშვნელოვანია, კლიენტსაც და კოლეგასაც.",
  },
  {
    name: "Dale Carnegie", years: "1888–1955", skill: "discovery",
    roleEn: "Salesman, teacher, author", roleKa: "გამყიდველი, მასწავლებელი, ავტორი",
    startEn: "A farm boy who sold bacon, soap and lard across rural Nebraska for a meatpacking company.",
    startKa: "ფერმერის შვილი, რომელიც ხორცის კომპანიისთვის ნებრასკის სოფლებში ბეკონს, საპონს და ქონს ყიდდა.",
    stepsEn: ["Turned a weak sales territory into one of the company's best.", "Started teaching public speaking classes to adults in New York.", "Wrote How to Win Friends and Influence People (1936), still a bestseller."],
    stepsKa: ["სუსტი გაყიდვების რეგიონი კომპანიის ერთ-ერთ საუკეთესოდ აქცია.", "ნიუ-იორკში ზრდასრულებს საჯარო გამოსვლას ასწავლიდა.", "დაწერა How to Win Friends and Influence People (1936), რომელიც დღემდე ბესტსელერია."],
    lessonEn: "Be genuinely interested in the other person. Ask, listen, and use their name.",
    lessonKa: "გულწრფელად დაინტერესდი მეორე ადამიანით. ჰკითხე, მოუსმინე და სახელით მიმართე.",
  },
  {
    name: "Sara Blakely", years: "b. 1971", skill: "objections",
    roleEn: "Founder of Spanx", roleKa: "Spanx-ის დამფუძნებელი",
    startEn: "Sold fax machines door to door for seven years and heard 'no' almost every day.",
    startKa: "შვიდი წელი ფაქსის აპარატებს კარდაკარ ყიდდა და თითქმის ყოველდღე „არას“ ისმენდა.",
    stepsEn: ["Founded Spanx in 2000 with $5,000 of her savings.", "Pitched store buyers herself and showed the product in person.", "Forbes named her the youngest self-made woman billionaire in 2012."],
    stepsKa: ["2000 წელს Spanx 5 000 დოლარის დანაზოგით დააარსა.", "მაღაზიების შემსყიდველებს თავად წარუდგენდა და პროდუქტს პირადად აჩვენებდა.", "2012 წელს Forbes-მა ყველაზე ახალგაზრდა თვითნაკეთ ქალ მილიარდერად დაასახელა."],
    lessonEn: "Rejection is training. Every 'no' made her faster at the next 'yes'.",
    lessonKa: "უარი ვარჯიშია. ყოველი „არა“ შემდეგ „კის“ აახლოებდა.",
  },
  {
    name: "Ray Kroc", years: "1902–1984", skill: "value",
    roleEn: "Built McDonald's into a global chain", roleKa: "McDonald's-ი გლობალურ ქსელად აქცია",
    startEn: "Spent decades as a traveling salesman of paper cups and then milkshake mixers.",
    startKa: "ათწლეულები მოგზაურ გამყიდველად იმუშავა: ჯერ ქაღალდის ჭიქებს ყიდდა, მერე მილკშეიკის მიქსერებს.",
    stepsEn: ["In 1954, at 52, he visited a restaurant that had ordered eight of his mixers.", "Saw how fast and consistent the system was and sold the brothers on franchising it.", "Turned it into one of the largest restaurant chains in the world."],
    stepsKa: ["1954 წელს, 52 წლისამ, ეწვია რესტორანს, რომელმაც მისგან რვა მიქსერი შეუკვეთა.", "დაინახა, რამდენად სწრაფი და სტაბილური იყო სისტემა, და ძმები ფრენჩაიზინგზე დაითანხმა.", "ის მსოფლიოს ერთ-ერთ უდიდეს რესტორნების ქსელად აქცია."],
    lessonEn: "Watch why customers buy. A big order is a clue to a bigger opportunity. And it's never too late.",
    lessonKa: "დააკვირდი, რატომ ყიდულობს კლიენტი. დიდი შეკვეთა უფრო დიდი შესაძლებლობის ნიშანია. და არასდროსაა გვიან.",
  },
  {
    name: "Estée Lauder", years: "1908–2004", skill: "value",
    roleEn: "Founder of Estée Lauder", roleKa: "Estée Lauder-ის დამფუძნებელი",
    startEn: "Began by selling skin creams her chemist uncle made, to friends and in beauty salons.",
    startKa: "დაიწყო ქიმიკოსი ბიძის დამზადებული კრემების გაყიდვით, მეგობრებსა და სილამაზის სალონებში.",
    stepsEn: ["Founded the company with her husband in 1946.", "Put the product on people's skin: free samples and live demos.", "Popularised the 'gift with purchase' that stores still use."],
    stepsKa: ["1946 წელს კომპანია მეუღლესთან ერთად დააარსა.", "პროდუქტს ხალხს პირდაპირ კანზე უსვამდა: უფასო ნიმუშები და ცოცხალი დემონსტრაცია.", "გაავრცელა „საჩუქარი შენაძენთან ერთად“, რომელსაც მაღაზიები დღემდე იყენებენ."],
    lessonEn: "Let them try it. Experience sells better than description.",
    lessonKa: "მიეცი გამოცდის საშუალება. გამოცდილება აღწერაზე უკეთ ყიდის.",
  },
  {
    name: "Steve Jobs", years: "1955–2011", skill: "value",
    roleEn: "Co-founder of Apple", roleKa: "Apple-ის თანადამფუძნებელი",
    startEn: "Started Apple with Steve Wozniak in 1976 and sold the first computers to a local shop.",
    startKa: "1976 წელს სტივ ვოზნიაკთან ერთად Apple დააარსა და პირველი კომპიუტერები ადგილობრივ მაღაზიას მიჰყიდა.",
    stepsEn: ["Pushed out of Apple in 1985, came back in 1997 when it was near collapse.", "Launched products on stage as stories: a problem, then a live demo of the fix.", "Introduced the iPhone in 2007 as three products in one."],
    stepsKa: ["1985 წელს Apple-იდან გააძევეს, 1997 წელს კი დაბრუნდა, როცა კომპანია კრახის პირას იყო.", "პროდუქტებს სცენაზე ისტორიად წარადგენდა: ჯერ პრობლემა, მერე გადაწყვეტის ცოცხალი დემო.", "2007 წელს iPhone სამი პროდუქტი ერთში წარადგინა."],
    lessonEn: "Sell the story, not the specs. Show the problem first, then the solution.",
    lessonKa: "გაყიდე ისტორია და არა მახასიათებლები. ჯერ პრობლემა აჩვენე, მერე გადაწყვეტა.",
  },
  {
    name: "Howard Schultz", years: "b. 1953", skill: "opening",
    roleEn: "Built Starbucks", roleKa: "Starbucks-ის შემქმნელი",
    startEn: "Grew up in public housing in Brooklyn and started his career selling for Xerox.",
    startKa: "ბრუკლინის სოციალურ საცხოვრებელში გაიზარდა და კარიერა Xerox-ში გამყიდველად დაიწყო.",
    stepsEn: ["Joined a small Seattle coffee seller in 1982.", "After a trip to Italy, pitched a café experience; when the owners said no, he started his own.", "Bought Starbucks in 1987 and grew it worldwide."],
    stepsKa: ["1982 წელს სიეტლში ყავის პატარა კომპანიას შეუერთდა.", "იტალიაში მოგზაურობის შემდეგ კაფეს იდეა შესთავაზა; როცა მფლობელებმა უარი უთხრეს, საკუთარი გახსნა.", "1987 წელს Starbucks იყიდა და მსოფლიოში გაავრცელა."],
    lessonEn: "People pay for how you make them feel. Sell the experience around the product.",
    lessonKa: "ხალხი იმაში იხდის, რას აგრძნობინებ. გაყიდე გამოცდილება პროდუქტის გარშემო.",
  },
  {
    name: "Warren Buffett", years: "b. 1930", skill: "opening",
    roleEn: "Investor, chairman of Berkshire Hathaway", roleKa: "ინვესტორი, Berkshire Hathaway-ს თავმჯდომარე",
    startEn: "As a boy sold chewing gum, Coca-Cola and newspapers door to door.",
    startKa: "ბავშვობაში საღეჭ რეზინს, Coca-Cola-ს და გაზეთებს კარდაკარ ყიდდა.",
    stepsEn: ["Was terrified of public speaking, so he took a Dale Carnegie course.", "Said it was the best investment he ever made.", "Became famous for explaining complex ideas in plain words."],
    stepsKa: ["საჯარო გამოსვლის საშინლად ეშინოდა, ამიტომ დეილ კარნეგის კურსი გაიარა.", "თქვა, რომ ეს მისი საუკეთესო ინვესტიცია იყო.", "ცნობილი გახდა რთული იდეების მარტივი სიტყვებით ახსნით."],
    lessonEn: "Communication is a skill you can train. Fear goes away with practice.",
    lessonKa: "კომუნიკაცია ვარჯიშით მისაღწევი უნარია. შიში პრაქტიკით ქრება.",
  },
];
