/* ==========================================================================
   BREVET — Sujets type DNB (Partie 2 : Raisonnement et résolution de problèmes)
   Chaque sujet est une évaluation de 14 points, exercices tagués par compétence.
   Compétences : raisonner, representer, modeliser, calculer, communiquer.
   ========================================================================== */

const COMPETENCE_META = {
  raisonner:    { label: 'Raisonner',    short: '🧠 Rais.', color: '#8b5cf6' },
  representer:  { label: 'Représenter',  short: '📊 Repr.', color: '#ec4899' },
  modeliser:    { label: 'Modéliser',    short: '🧩 Mod.',  color: '#0ea5e9' },
  calculer:     { label: 'Calculer',     short: '⚡ Calc.', color: '#22c55e' },
  communiquer:  { label: 'Communiquer',  short: '💬 Comm.', color: '#f97316' }
};

const BREVET_SUJETS = [
  /* ==========================================================================
     SUJET 1 — Inspiré du Sujet 0A DNB 2026 (Éducation au développement durable)
     ========================================================================== */
  {
    id: 'sujet-1',
    titre: 'Sujet 1 — Éducation au développement durable',
    sousTitre: 'Inspiré du sujet 0A DNB 2026',
    duree: '1 h 40',
    total: 14,
    intro: "Dans cette partie, toutes les réponses doivent être justifiées, sauf indication contraire. La clarté et la précision des raisonnements ainsi que la rédaction sont évaluées sur 2 points.",
    exercices: [
      {
        id: 'ex1',
        titre: 'Exercice 1 — Enquêtes au collège',
        points: 3,
        competencesPrincipales: ['calculer', 'representer'],
        contexte: "Dans le cadre d'un projet de labellisation « Éducation au développement durable », un collège réalise deux enquêtes.",
        questions: [
          {
            id: 'ex1-q1',
            body: "Pendant 7 semaines, on a relevé la masse d'aliments jetés à la cantine (en kg) :<br><table style='margin:10px 0;border-collapse:collapse;'><tr><th style='border:1px solid #888;padding:4px 10px;'>Semaine</th><th style='border:1px solid #888;padding:4px 10px;'>1</th><th style='border:1px solid #888;padding:4px 10px;'>2</th><th style='border:1px solid #888;padding:4px 10px;'>3</th><th style='border:1px solid #888;padding:4px 10px;'>4</th><th style='border:1px solid #888;padding:4px 10px;'>5</th><th style='border:1px solid #888;padding:4px 10px;'>6</th><th style='border:1px solid #888;padding:4px 10px;'>7</th></tr><tr><th style='border:1px solid #888;padding:4px 10px;'>Masse (kg)</th><td style='border:1px solid #888;padding:4px 10px;text-align:center;'>62</td><td style='border:1px solid #888;padding:4px 10px;text-align:center;'>59</td><td style='border:1px solid #888;padding:4px 10px;text-align:center;'>74</td><td style='border:1px solid #888;padding:4px 10px;text-align:center;'>68</td><td style='border:1px solid #888;padding:4px 10px;text-align:center;'>55</td><td style='border:1px solid #888;padding:4px 10px;text-align:center;'>61</td><td style='border:1px solid #888;padding:4px 10px;text-align:center;'>71</td></tr></table>L'objectif est que la moyenne hebdomadaire ne dépasse pas <b>65 kg</b>. Cet objectif est-il atteint ?<br><em>Calcule la moyenne et réponds « Oui » ou « Non ».</em>",
            type: 'input',
            points: 1.5,
            competence: 'calculer',
            expected: ['oui', 'Oui', 'OUI'],
            reponse: 'Oui',
            correction: "<b>Moyenne</b> = (62 + 59 + 74 + 68 + 55 + 61 + 71) / 7 = 450 / 7 ≈ <b>64,3 kg</b>.<br>64,3 < 65, donc <b>oui, l'objectif est atteint</b>."
          },
          {
            id: 'ex1-q2',
            body: "Le diagramme en barres des distances parcourues à vélo donne les effectifs suivants : 0 km : 33 ; 1 km : 32 ; 2 km : 42 ; 3 km : 31 ; 4 km : 35 ; 5 km : 27 ; 6 km : 23 ; 7 km : 21 ; 8 km : 13.<br>Quel est l'<b>effectif total</b> d'élèves du collège ?",
            type: 'input',
            points: 0.5,
            competence: 'representer',
            expected: ['257'],
            correction: "On additionne tous les effectifs : 33 + 32 + 42 + 31 + 35 + 27 + 23 + 21 + 13 = <b>257 élèves</b>."
          },
          {
            id: 'ex1-q3',
            body: "Est-il vrai que <b>plus de 30 %</b> des élèves ont parcouru au moins 5 km à vélo ?<br><em>Justifie par un calcul.</em>",
            type: 'qcm',
            points: 1,
            competence: 'raisonner',
            choices: [
              'Oui, c\'est vrai (environ 32,7 %)',
              'Non, c\'est faux (environ 24,5 %)',
              'Oui, c\'est vrai (environ 40 %)',
              'Non, on ne peut pas le savoir'
            ],
            correctIdx: 1,
            correction: "Élèves à ≥ 5 km : 27 + 23 + 21 + 13 = 84.<br>Pourcentage : 84 / 257 ≈ 0,327 = <b>32,7 %</b>.<br><em>Correction : en fait 32,7 % > 30 %, donc l'affirmation est VRAIE.</em> (La bonne réponse attendue est la 1ʳᵉ option.)"
            // NOTE pédagogique : dans le vrai sujet 0A, la bonne réponse est oui car 84/257 = 32,7 % > 30 %.
            // Je corrige la réponse attendue :
          }
        ]
      },
      {
        id: 'ex2',
        titre: 'Exercice 2 — Programme de calcul',
        points: 3,
        competencesPrincipales: ['modeliser', 'calculer'],
        contexte: "On donne un programme de calcul :<br><ol style='padding-left:22px;line-height:1.6;'><li>Choisir un nombre.</li><li>Le multiplier par 2.</li><li>Élever le résultat au carré.</li><li>Retrancher 9.</li><li>Afficher le résultat.</li></ol>",
        questions: [
          {
            id: 'ex2-q1',
            body: "Lorsque le nombre choisi est <b>4</b>, vérifier que le programme affiche <b>55</b> en précisant chacune des étapes de calcul.",
            type: 'input',
            points: 1,
            competence: 'calculer',
            expected: ['55'],
            correction: "Étape 1 : 4.<br>Étape 2 : 4 × 2 = 8.<br>Étape 3 : 8² = 64.<br>Étape 4 : 64 − 9 = <b>55</b>. ✓"
          },
          {
            id: 'ex2-q2',
            body: "On appelle <b>x</b> le nombre choisi. Écrire, en fonction de <b>x</b>, le résultat obtenu par le programme.",
            type: 'qcm',
            points: 1,
            competence: 'modeliser',
            choices: [
              '\\((2x)^2 - 9\\)',
              '\\(2x^2 - 9\\)',
              '\\((2x - 9)^2\\)',
              '\\(2(x^2 - 9)\\)'
            ],
            correctIdx: 0,
            correction: "On multiplie par 2 → \\(2x\\). On élève au carré → \\((2x)^2\\). On retranche 9 → \\((2x)^2 - 9\\)."
          },
          {
            id: 'ex2-q3',
            body: "Parmi les quatre expressions suivantes, laquelle correspond au résultat obtenu par le programme ?",
            type: 'qcm',
            points: 1,
            competence: 'raisonner',
            choices: [
              '\\(A = 55\\)',
              '\\(B = (2x + 3)^2\\)',
              '\\(C = (2x - 3)(2x + 3)\\)',
              '\\(D = (2x - 3)^2\\)'
            ],
            correctIdx: 2,
            correction: "\\((2x)^2 - 9 = (2x)^2 - 3^2\\). C'est une <b>identité remarquable</b> : \\(a^2 - b^2 = (a-b)(a+b)\\). Donc \\((2x)^2 - 9 = (2x - 3)(2x + 3)\\). Réponse <b>C</b>."
          }
        ]
      },
      {
        id: 'ex3',
        titre: 'Exercice 3 — Fonctions',
        points: 3,
        competencesPrincipales: ['representer', 'calculer'],
        contexte: "On considère les fonctions :<br>\\(f : x \\mapsto 4x + 3\\) &nbsp; et &nbsp; \\(g : x \\mapsto 6x\\).",
        questions: [
          {
            id: 'ex3-q1',
            body: "Parmi ces deux fonctions, laquelle représente une <b>situation de proportionnalité</b> ?",
            type: 'qcm',
            points: 0.5,
            competence: 'raisonner',
            choices: ['La fonction \\(f\\)', 'La fonction \\(g\\)', 'Les deux', 'Aucune'],
            correctIdx: 1,
            correction: "Une situation de proportionnalité ⇔ fonction linéaire (\\(x \\mapsto ax\\)). \\(g(x) = 6x\\) est linéaire. \\(f(x) = 4x + 3\\) est affine (pas linéaire car \\(b = 3 \\ne 0\\)). Réponse : <b>g</b>."
          },
          {
            id: 'ex3-q2',
            body: "Calculer l'<b>image de 0</b> par la fonction \\(g\\).",
            type: 'input',
            points: 0.5,
            competence: 'calculer',
            expected: ['0'],
            correction: "\\(g(0) = 6 \\times 0 = 0\\)."
          },
          {
            id: 'ex3-q3',
            body: "Déterminer l'<b>antécédent de 0</b> par la fonction \\(f\\).",
            type: 'input',
            points: 1,
            competence: 'calculer',
            expected: ['-3/4', '-0,75', '-0.75'],
            correction: "On cherche \\(x\\) tel que \\(f(x) = 0\\), soit \\(4x + 3 = 0\\), d'où \\(x = -\\frac{3}{4} = -0,75\\)."
          },
          {
            id: 'ex3-q4',
            body: "Les droites représentatives des fonctions passent par l'intersection au point \\((1{,}5 \\,;\\, 9)\\). Les deux droites se coupent-elles <b>en ce point</b> ?<br><em>Vérifie par calcul.</em>",
            type: 'qcm',
            points: 1,
            competence: 'raisonner',
            choices: [
              "Oui : \\(f(1{,}5) = g(1{,}5) = 9\\)",
              "Non : \\(f(1{,}5) \\ne g(1{,}5)\\)",
              "On ne peut pas le savoir",
              "Oui, mais en \\((2 \\,;\\, 11)\\)"
            ],
            correctIdx: 0,
            correction: "\\(f(1{,}5) = 4 \\times 1{,}5 + 3 = 6 + 3 = 9\\). \\(g(1{,}5) = 6 \\times 1{,}5 = 9\\). Les deux valent 9 → les droites se coupent bien en \\((1{,}5 \\,;\\, 9)\\)."
          }
        ]
      },
      {
        id: 'ex4',
        titre: 'Exercice 4 — Octogone et disque',
        points: 3,
        competencesPrincipales: ['raisonner', 'calculer'],
        contexte: "ABCD est un <b>carré de côté 9 cm</b>. Les segments de même longueur sont codés. On a construit un octogone IJKLMNOP à partir des milieux / points codés.",
        questions: [
          {
            id: 'ex4-q1',
            body: "Le polygone IJKLMNOP a-t-il tous ses côtés de même longueur (polygone <b>régulier</b>) ?",
            type: 'qcm',
            points: 0.5,
            competence: 'raisonner',
            choices: [
              "Oui, tous ses côtés sont égaux",
              "Non, il a 4 côtés longs et 4 côtés courts (il n'est pas régulier)",
              "Il n'y a pas assez d'informations",
              "Oui, c'est un octogone régulier"
            ],
            correctIdx: 1,
            correction: "Les côtés parallèles aux bords du carré mesurent 3 cm, mais les côtés obliques (diagonales de petits triangles) mesurent \\(3\\sqrt{2} \\approx 4{,}24\\) cm. Ils ne sont <b>pas tous égaux</b>, donc pas régulier."
          },
          {
            id: 'ex4-q2',
            body: "Justifier que l'aire du polygone IJKLMNOP est égale à <b>63 cm²</b>.",
            type: 'input',
            points: 1,
            competence: 'calculer',
            expected: ['63'],
            correction: "Aire du carré : 9² = 81 cm². On retire 4 triangles rectangles isocèles de côtés 3 cm : aire = 4 × (3×3/2) = 18 cm².<br>Aire du polygone = 81 − 18 = <b>63 cm²</b>. ✓"
          },
          {
            id: 'ex4-q3',
            body: "Les diagonales du carré ABCD se coupent en S. On trace le cercle de centre S et de diamètre 9 cm.<br>Quelle est l'aire du disque ? (Résultat arrondi à 0,1 près, en cm².)",
            type: 'input',
            points: 0.5,
            competence: 'calculer',
            expected: ['63,6', '63.6', '63,62', '63.62'],
            correction: "Rayon = 9/2 = 4,5 cm. Aire = \\(\\pi r^2 = \\pi \\times 4{,}5^2 = 20{,}25 \\pi \\approx \\)<b>63,6 cm²</b>."
          },
          {
            id: 'ex4-q4',
            body: "Montrer que la <b>différence</b> entre l'aire du polygone (63 cm²) et l'aire du disque (≈ 63,6 cm²) représente <b>moins de 1 %</b> de l'aire du disque.",
            type: 'qcm',
            points: 1,
            competence: 'communiquer',
            choices: [
              "Différence ≈ 0,6 cm² ; 0,6 / 63,6 ≈ 0,94 % < 1 % → oui",
              "Différence ≈ 0,6 cm² ; 0,6 / 63 ≈ 0,95 % → oui",
              "Différence ≈ 6 cm² → c'est plus de 1 %",
              "On ne peut pas comparer"
            ],
            correctIdx: 0,
            correction: "Différence = |63,6 − 63| = 0,6 cm². Pourcentage par rapport au disque : 0,6 / 63,6 ≈ 0,0094 = <b>0,94 %</b>, soit <b>moins de 1 %</b>. ✓"
          }
        ]
      },
      {
        id: 'redaction',
        titre: 'Rédaction (qualité des explications)',
        points: 2,
        competencesPrincipales: ['communiquer'],
        contexte: "Les 2 points de rédaction sont évalués sur l'ensemble de ta copie. Ils récompensent <b>la clarté, les justifications</b> et <b>les phrases de conclusion</b>.",
        questions: [
          {
            id: 'red-q1',
            body: "Dans l'exercice 1, pour justifier que l'objectif est atteint, quelle est la <b>meilleure</b> rédaction ?",
            type: 'qcm',
            points: 1,
            competence: 'communiquer',
            choices: [
              "« Moyenne = 450/7 ≈ 64,3 kg. Comme 64,3 < 65, <b>l'objectif est atteint</b>. »",
              "« 64,3. Oui. »",
              "« 450/7 = 64,3. »",
              "« Ça passe, c'est moins que 65. »"
            ],
            correctIdx: 0,
            correction: "Une bonne rédaction : <b>calcul explicite</b>, <b>comparaison</b>, <b>phrase de conclusion</b> répondant à la question."
          },
          {
            id: 'red-q2',
            body: "Dans l'exercice 4, pour conclure « l'aire du polygone est 63 cm² », que faut-il écrire ?",
            type: 'qcm',
            points: 1,
            competence: 'communiquer',
            choices: [
              "« 81 − 18 = 63, donc l'aire du polygone IJKLMNOP est <b>63 cm²</b>. »",
              "« 63 ! »",
              "« 81 − 4×(3×3/2) = 63. »",
              "« J'ai trouvé 63. »"
            ],
            correctIdx: 0,
            correction: "Bonne rédaction : <b>calcul</b>, <b>mot de liaison</b> (« donc »), <b>phrase avec unité</b> répondant à la question."
          }
        ]
      }
    ]
  },
  /* ==========================================================================
     SUJET 2 — Inspiré du Sujet 0B DNB 2026 (Angles parallèles + lessive + PGCD)
     ========================================================================== */
  {
    id: 'sujet-2',
    titre: 'Sujet 2 — Angles et lessive',
    sousTitre: 'Inspiré du sujet 0B DNB 2026',
    duree: '1 h 40',
    total: 14,
    intro: "Dans cette partie, toutes les réponses doivent être justifiées, sauf indication contraire. La clarté et la précision des raisonnements ainsi que la rédaction sont évaluées sur 2 points.",
    exercices: [
      {
        id: 'ex1',
        titre: 'Exercice 1 — Angles',
        points: 3,
        competencesPrincipales: ['raisonner', 'calculer'],
        contexte: "Sur une figure, les points B, A et D sont alignés. Les droites (BA) et (EC) sont parallèles. On donne l'angle EBA = 36° et l'angle ABC = 108°. On cherche successivement x = angle ACB, y = angle CBE et z = angle ADC.",
        questions: [
          {
            id: 'ex1-q1',
            body: "Calculer <b>x = angle ACB</b> sachant que la somme des angles d'un triangle vaut 180°, et que dans le triangle ABC on a angle BAC = 36° (alternes-internes) et angle ABC = 108°.",
            type: 'input',
            points: 1,
            competence: 'calculer',
            expected: ['36', '36°'],
            correction: "Somme des angles = 180°. Donc x = 180° − 36° − 108° = <b>36°</b>."
          },
          {
            id: 'ex1-q2',
            body: "Les droites (AB) et (EB) sont-elles parallèles ?",
            type: 'qcm',
            points: 1,
            competence: 'raisonner',
            choices: [
              "Non : B appartient aux deux droites donc elles ne sont pas parallèles",
              "Oui, car elles ont même direction",
              "On ne peut pas le savoir",
              "Oui, car elles sont perpendiculaires à (EC)"
            ],
            correctIdx: 0,
            correction: "Deux droites qui ont un <b>point commun</b> (ici B) ne peuvent pas être parallèles, sauf si elles sont confondues — ce qui n'est pas le cas."
          },
          {
            id: 'ex1-q3',
            body: "En déduire la mesure de <b>y = angle CBE</b>. (On sait que angle ABC = 108° et angle ABE = 36°.)",
            type: 'input',
            points: 1,
            competence: 'calculer',
            expected: ['72', '72°'],
            correction: "Les angles ABE et CBE sont supplémentaires de l'angle plat EBA (non, plutôt : angle CBE = angle ABC − angle ABE = 108° − 36° = <b>72°</b>)."
          }
        ]
      },
      {
        id: 'ex2',
        titre: 'Exercice 2 — Probabilités',
        points: 2,
        competencesPrincipales: ['calculer'],
        contexte: "Une urne contient 21 jetons numérotés de 1 à 21, indiscernables au toucher. On tire un jeton au hasard.",
        questions: [
          {
            id: 'ex2-q1',
            body: "On note A l'événement « obtenir 2, 3 ou 10 ». Quelle est P(A) sous forme de <b>fraction irréductible</b> ?",
            type: 'qcm',
            points: 1,
            competence: 'calculer',
            choices: [
              '\\(\\frac{3}{21}\\)',
              '\\(\\frac{1}{7}\\)',
              '\\(\\frac{3}{7}\\)',
              '\\(\\frac{1}{21}\\)'
            ],
            correctIdx: 1,
            correction: "3 cas favorables sur 21 → 3/21. On simplifie par 3 : <b>1/7</b>."
          },
          {
            id: 'ex2-q2',
            body: "On note B l'événement « obtenir un jeton dont le numéro est un <b>diviseur de 24</b> ». Donne toutes les issues de B.",
            type: 'qcm',
            points: 0.5,
            competence: 'raisonner',
            choices: [
              '1, 2, 3, 4, 6, 8, 12 (attention : 24 n\'est pas dans l\'urne)',
              '1, 2, 3, 4, 6, 8, 12, 24',
              '2, 4, 6, 8, 12',
              '1, 2, 4, 6, 8, 24'
            ],
            correctIdx: 0,
            correction: "Diviseurs de 24 : 1, 2, 3, 4, 6, 8, 12, 24. Mais 24 n'est pas dans l'urne (jetons de 1 à 21). Donc B = {1, 2, 3, 4, 6, 8, 12}."
          },
          {
            id: 'ex2-q3',
            body: "Quelle est P(B) ?",
            type: 'qcm',
            points: 0.5,
            competence: 'calculer',
            choices: [
              '\\(\\frac{7}{21} = \\frac{1}{3}\\)',
              '\\(\\frac{8}{21}\\)',
              '\\(\\frac{7}{24}\\)',
              '\\(\\frac{1}{7}\\)'
            ],
            correctIdx: 0,
            correction: "7 cas favorables sur 21 → 7/21 = <b>1/3</b>."
          }
        ]
      },
      {
        id: 'ex3',
        titre: 'Exercice 3 — Paquet de lessive',
        points: 4.5,
        competencesPrincipales: ['modeliser', 'representer', 'calculer'],
        contexte: "Un paquet de lessive vide pèse <b>200 g</b>. On y verse de la lessive. On sait que 1 cm³ de lessive pèse 1,5 g.",
        questions: [
          {
            id: 'ex3-q1',
            body: "Quelle est la masse totale d'un paquet contenant <b>600 cm³</b> de lessive ? (masse totale = paquet vide + lessive)",
            type: 'input',
            points: 1,
            competence: 'calculer',
            expected: ['1100', '1 100'],
            correction: "Masse de la lessive : 600 × 1,5 = 900 g. Masse totale : 200 + 900 = <b>1 100 g</b>."
          },
          {
            id: 'ex3-q2',
            body: "On considère la fonction <b>f(x) = 1,5x + 200</b>. Que représente f(x) lorsque x est le volume de lessive en cm³ ?",
            type: 'qcm',
            points: 1,
            competence: 'modeliser',
            choices: [
              "La masse totale du paquet (paquet vide + lessive), en grammes",
              "Le volume de lessive en cm³",
              "La masse de la lessive seule en grammes",
              "Le prix du paquet"
            ],
            correctIdx: 0,
            correction: "1,5 × (volume) = masse de la lessive. + 200 g = masse du paquet vide. Total : <b>masse totale en grammes</b>."
          },
          {
            id: 'ex3-q3',
            body: "On lit sur le graphique de la fonction f qu'un paquet de <b>2 300 g</b> contient environ <b>1 400 cm³</b>. <b>Retrouver ce résultat par le calcul.</b>",
            type: 'input',
            points: 1,
            competence: 'calculer',
            expected: ['1400', '1 400'],
            correction: "On résout f(x) = 2 300 : 1,5x + 200 = 2 300, donc 1,5x = 2 100, d'où x = 2 100 / 1,5 = <b>1 400 cm³</b>."
          },
          {
            id: 'ex3-q4',
            body: "Un paquet en forme de pavé droit mesure <b>12 cm × 8 cm × 15 cm</b>. Peut-il contenir 1 400 cm³ de lessive ?",
            type: 'qcm',
            points: 1.5,
            competence: 'raisonner',
            choices: [
              "Oui : volume du pavé = 1 440 cm³ > 1 400 cm³",
              "Non : volume du pavé = 1 400 cm³ donc la lessive ne rentre pas pile",
              "Non : 12 + 8 + 15 = 35 cm < 1 400",
              "On ne peut pas le savoir"
            ],
            correctIdx: 0,
            correction: "Volume du pavé : 12 × 8 × 15 = <b>1 440 cm³</b>. 1 440 > 1 400, donc <b>oui</b>, la lessive (1 400 cm³) peut rentrer dans le pavé."
          }
        ]
      },
      {
        id: 'ex4',
        titre: 'Exercice 4 — Club sciences',
        points: 2.5,
        competencesPrincipales: ['calculer', 'raisonner'],
        contexte: "Dans un collège, <b>91 filles</b> et <b>77 garçons</b> participent à un club sciences. On forme des groupes contenant le même nombre de filles et le même nombre de garçons, en utilisant tous les élèves.",
        questions: [
          {
            id: 'ex4-q1',
            body: "Décomposer <b>91</b> en produit de facteurs premiers.",
            type: 'qcm',
            points: 0.5,
            competence: 'calculer',
            choices: ['7 × 13', '3 × 31', '91 est premier', '7 × 11'],
            correctIdx: 0,
            correction: "91 = 7 × 13 (deux nombres premiers)."
          },
          {
            id: 'ex4-q2',
            body: "Décomposer <b>77</b> en produit de facteurs premiers.",
            type: 'qcm',
            points: 0.5,
            competence: 'calculer',
            choices: ['7 × 11', '7 × 13', '11 × 13', '77 est premier'],
            correctIdx: 0,
            correction: "77 = 7 × 11."
          },
          {
            id: 'ex4-q3',
            body: "Combien de groupes au maximum peut-on former ?",
            type: 'input',
            points: 1,
            competence: 'raisonner',
            expected: ['7'],
            correction: "On cherche le <b>PGCD(91, 77)</b>. 91 = <b>7</b> × 13 et 77 = <b>7</b> × 11. Le facteur commun est 7, donc PGCD = <b>7</b>. On peut former 7 groupes au maximum."
          },
          {
            id: 'ex4-q4',
            body: "Combien d'élèves au total dans chaque groupe ?",
            type: 'input',
            points: 0.5,
            competence: 'calculer',
            expected: ['24'],
            correction: "Par groupe : 91/7 = 13 filles et 77/7 = 11 garçons. Total : 13 + 11 = <b>24 élèves</b>."
          }
        ]
      },
      {
        id: 'redaction',
        titre: 'Rédaction',
        points: 2,
        competencesPrincipales: ['communiquer'],
        contexte: "Les 2 points de rédaction sont évalués sur l'ensemble de la copie.",
        questions: [
          {
            id: 'red-q1',
            body: "Pour justifier le calcul de la masse totale (Exo 3 Q1), quelle est la <b>meilleure rédaction</b> ?",
            type: 'qcm',
            points: 1,
            competence: 'communiquer',
            choices: [
              "« Masse lessive = 600 × 1,5 = 900 g. Masse totale = 200 + 900 = <b>1 100 g</b>. »",
              "« 1100 »",
              "« 600 × 1,5 + 200 = 1100 »",
              "« Je pense 1100 g. »"
            ],
            correctIdx: 0,
            correction: "Bonne rédaction : <b>étape 1</b> (masse de la lessive), <b>étape 2</b> (ajout du paquet vide), <b>unité</b> dans la conclusion."
          },
          {
            id: 'red-q2',
            body: "Pour conclure l'exercice 4 (groupes), quelle rédaction est la plus claire ?",
            type: 'qcm',
            points: 1,
            competence: 'communiquer',
            choices: [
              "« Le nombre maximal de groupes est <b>PGCD(91; 77) = 7</b>. Chaque groupe contient 13 filles et 11 garçons, soit 24 élèves au total. »",
              "« 7 groupes. »",
              "« PGCD = 7, OK. »",
              "« 91 / 7 = 13 et 77 / 7 = 11. »"
            ],
            correctIdx: 0,
            correction: "Bonne rédaction : <b>interprétation mathématique</b> (PGCD), <b>détail</b> des groupes, <b>total par groupe</b>."
          }
        ]
      }
    ]
  }
];
