-- Lex Memoria — Seed Data
-- Philippine Civil Code Book 1, Articles 1–20
-- Run AFTER schema.sql

INSERT INTO articles (book, chapter, article_number, title, content_md) VALUES

-- Chapter 1: Effect and Application of Laws (Articles 1–18)
(
  'Book 1',
  'Chapter 1 — Effect and Application of Laws',
  1,
  'Article 1',
  'This Act shall be known as the "Civil Code of the Philippines."'
),
(
  'Book 1',
  'Chapter 1 — Effect and Application of Laws',
  2,
  'Article 2',
  'Laws shall take effect after fifteen days following the completion of their publication in the Official Gazette, unless it is otherwise provided. This Code shall take effect one year after such publication.'
),
(
  'Book 1',
  'Chapter 1 — Effect and Application of Laws',
  3,
  'Article 3',
  'Ignorance of the law excuses no one from compliance therewith.'
),
(
  'Book 1',
  'Chapter 1 — Effect and Application of Laws',
  4,
  'Article 4',
  'Laws shall have no retroactive effect, unless the contrary is provided.'
),
(
  'Book 1',
  'Chapter 1 — Effect and Application of Laws',
  5,
  'Article 5',
  'Acts executed against the provisions of mandatory or prohibitory laws shall be void, except when the law itself authorizes their validity.'
),
(
  'Book 1',
  'Chapter 1 — Effect and Application of Laws',
  6,
  'Article 6',
  'Rights may be waived, unless the waiver is contrary to law, public order, public policy, morals, or good customs, or prejudicial to a third person with a right recognized by law.'
),
(
  'Book 1',
  'Chapter 1 — Effect and Application of Laws',
  7,
  'Article 7',
  'Laws are repealed only by subsequent ones, and their violation or non-observance shall not be excused by disuse, or custom or practice to the contrary. When the courts declared a law to be inconsistent with the Constitution, the former shall be void and the latter shall govern. Administrative or executive acts, orders and regulations shall be valid only when they are not contrary to the laws or the Constitution.'
),
(
  'Book 1',
  'Chapter 1 — Effect and Application of Laws',
  8,
  'Article 8',
  'Judicial decisions applying or interpreting the laws or the Constitution shall form a part of the legal system of the Philippines.'
),
(
  'Book 1',
  'Chapter 1 — Effect and Application of Laws',
  9,
  'Article 9',
  'No judge or court shall decline to render judgment by reason of the silence, obscurity or insufficiency of the laws.'
),
(
  'Book 1',
  'Chapter 1 — Effect and Application of Laws',
  10,
  'Article 10',
  'In case of doubt in the interpretation or application of laws, it is presumed that the lawmaking body intended right and justice to prevail.'
),
(
  'Book 1',
  'Chapter 1 — Effect and Application of Laws',
  11,
  'Article 11',
  'Customs which are contrary to law, public order or public policy shall not be countenanced.'
),
(
  'Book 1',
  'Chapter 1 — Effect and Application of Laws',
  12,
  'Article 12',
  'A custom must be proved as a fact, according to the rules of evidence.'
),
(
  'Book 1',
  'Chapter 1 — Effect and Application of Laws',
  13,
  'Article 13',
  'When the laws speak of years, months, days or nights, it shall be understood that years are of three hundred sixty-five days each; months, of thirty days; days, of twenty-four hours; and nights, from sunset to sunrise. If months are designated by their name, they shall be computed by the number of days which they respectively have. In computing a period, the first day shall be excluded, and the last day included.'
),
(
  'Book 1',
  'Chapter 1 — Effect and Application of Laws',
  14,
  'Article 14',
  'Penal laws and those of public security and safety shall be obligatory upon all who live or sojourn in Philippine territory, subject to the principles of public international law and to treaty stipulations.'
),
(
  'Book 1',
  'Chapter 1 — Effect and Application of Laws',
  15,
  'Article 15',
  'Laws relating to family rights and duties, or to the status, condition and legal capacity of persons are binding upon citizens of the Philippines, even though living abroad.'
),
(
  'Book 1',
  'Chapter 1 — Effect and Application of Laws',
  16,
  'Article 16',
  'Real property as well as personal property is subject to the law of the country where it is situated. However, intestate and testamentary succession, both with respect to the order of succession and to the amount of successional rights and to the intrinsic validity of testamentary provisions, shall be regulated by the national law of the person whose succession is under consideration, whatever may be the nature of the property and regardless of the country wherein said property may be found.'
),
(
  'Book 1',
  'Chapter 1 — Effect and Application of Laws',
  17,
  'Article 17',
  'The forms and solemnities of contracts, wills, and other public instruments shall be governed by the laws of the country in which they are executed. When the acts referred to are executed before the diplomatic or consular officials of the Republic of the Philippines in a foreign country, the solemnities established by Philippine laws shall be observed in their execution. Prohibitive laws concerning persons, their acts or property, and those which have for their object public order, public policy and good customs shall not be rendered ineffective by laws or judgments promulgated, or by determinations or conventions agreed upon in a foreign country.'
),
(
  'Book 1',
  'Chapter 1 — Effect and Application of Laws',
  18,
  'Article 18',
  'In matters which are governed by the Code of Commerce and special laws, their deficiency shall be supplied by the provisions of this Code.'
),

-- Chapter 2: Civil Personality (Articles 37–47, shown as 19–20 in our seed for brevity)
-- We use the actual Article 37 and 38 as our "19" and "20" entries
-- Actually let's seed true articles 19 and 20 from the Human Relations chapter
(
  'Book 1',
  'Chapter 2 — Human Relations',
  19,
  'Article 19',
  'Every person must, in the exercise of his rights and in the performance of his duties, act with justice, give everyone his due, and observe honesty and good faith.'
),
(
  'Book 1',
  'Chapter 2 — Human Relations',
  20,
  'Article 20',
  'Every person who, contrary to law, wilfully or negligently causes damage to another, shall indemnify the latter for the same.'
);
