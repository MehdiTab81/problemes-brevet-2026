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
        competencesPrincipales: ['calculer', 'representer', 'communiquer'],
        contexte: "Dans le cadre d'un projet de labellisation « Éducation au développement durable », un collège réalise deux enquêtes.",
        questions: [
          {
            // Q1a : calcul de la moyenne (1 pt — compétence Calculer)
            id: 'ex1-q1a',
            body: "Pendant 7 semaines, on a relevé la masse d'aliments jetés à la cantine (en kg) :<br><table style='margin:10px 0;border-collapse:collapse;'><tr><th style='border:1px solid #888;padding:4px 10px;'>Semaine</th><th style='border:1px solid #888;padding:4px 10px;'>1</th><th style='border:1px solid #888;padding:4px 10px;'>2</th><th style='border:1px solid #888;padding:4px 10px;'>3</th><th style='border:1px solid #888;padding:4px 10px;'>4</th><th style='border:1px solid #888;padding:4px 10px;'>5</th><th style='border:1px solid #888;padding:4px 10px;'>6</th><th style='border:1px solid #888;padding:4px 10px;'>7</th></tr><tr><th style='border:1px solid #888;padding:4px 10px;'>Masse (kg)</th><td style='border:1px solid #888;padding:4px 10px;text-align:center;'>62</td><td style='border:1px solid #888;padding:4px 10px;text-align:center;'>59</td><td style='border:1px solid #888;padding:4px 10px;text-align:center;'>74</td><td style='border:1px solid #888;padding:4px 10px;text-align:center;'>68</td><td style='border:1px solid #888;padding:4px 10px;text-align:center;'>55</td><td style='border:1px solid #888;padding:4px 10px;text-align:center;'>61</td><td style='border:1px solid #888;padding:4px 10px;text-align:center;'>71</td></tr></table>Calculer la <b>moyenne</b> de la masse hebdomadaire d'aliments jetés, arrondie au dixième de kg.",
            type: 'input',
            points: 1,
            competence: 'calculer',
            expected: ['64,3', '64.3', '450/7'],
            correction: "Somme des masses : 62 + 59 + 74 + 68 + 55 + 61 + 71 = <b>450 kg</b>.<br>Moyenne : 450 / 7 ≈ <b>64,3 kg</b>."
          },
          {
            // Q1b : justification/argumentation (0,5 pt — compétence Communiquer)
            id: 'ex1-q1b',
            body: "Le collège s'est fixé pour objectif que la moyenne hebdomadaire ne dépasse pas <b>65 kg</b>.<br>Parmi ces justifications, laquelle est la <b>mieux rédigée</b> et répond complètement à la question « l'objectif est-il atteint ? » ?",
            type: 'qcm',
            points: 0.5,
            competence: 'communiquer',
            choices: [
              "« La moyenne est d'environ 64,3 kg. Comme 64,3 < 65, <b>l'objectif est atteint</b>. »",
              "« Oui. »",
              "« 450/7 = 64,3. »",
              "« La moyenne est inférieure à 65, donc c'est bon. » (sans donner la valeur)"
            ],
            correctIdx: 0,
            correction: "Bonne rédaction = <b>1) annoncer le résultat</b> (la moyenne ≈ 64,3 kg), <b>2) comparer</b> avec l'objectif (64,3 < 65), <b>3) conclure clairement</b> (« l'objectif est atteint »). Les autres réponses sont incomplètes ou ne comparent pas explicitement."
          },
          {
            // Q2 : effectif total du diagramme
            id: 'ex1-q2',
            body: "Le diagramme en barres des distances parcourues à vélo donne les effectifs suivants :<br>0 km : <b>33</b> ; 1 km : <b>32</b> ; 2 km : <b>42</b> ; 3 km : <b>31</b> ; 4 km : <b>35</b> ; 5 km : <b>27</b> ; 6 km : <b>23</b> ; 7 km : <b>21</b> ; 8 km : <b>13</b>.<br>Quel est l'<b>effectif total</b> d'élèves du collège ?",
            type: 'input',
            points: 0.5,
            competence: 'representer',
            expected: ['257'],
            correction: "On additionne tous les effectifs : 33 + 32 + 42 + 31 + 35 + 27 + 23 + 21 + 13 = <b>257 élèves</b>."
          },
          {
            // Q3 : pourcentage ≥ 5 km (QCM avec erreurs fréquentes)
            id: 'ex1-q3',
            body: "Est-il vrai que <b>plus de 30 %</b> des élèves ont parcouru <b>au moins 5 km</b> à vélo ?<br>Quelle est la bonne démarche et la bonne conclusion ?",
            type: 'qcm',
            points: 1,
            competence: 'raisonner',
            choices: [
              // Bonne réponse
              "Élèves ≥ 5 km : 27 + 23 + 21 + 13 = <b>84</b>. Pourcentage : 84/257 ≈ <b>32,7 %</b>. Comme 32,7 % > 30 %, <b>l'affirmation est vraie</b>.",
              // Erreur fréquente : confondre « au moins 5 km » avec « moins de 5 km »
              "Élèves ≥ 5 km : 33 + 32 + 42 + 31 + 35 = <b>173</b>. Pourcentage : 173/257 ≈ <b>67,3 %</b>. Donc oui, c'est vrai.",
              // Erreur fréquente : mauvais dénominateur (on divise par 100 ou par les 5 km seulement)
              "Élèves ≥ 5 km : 27 + 23 + 21 + 13 = 84. Pourcentage : 84/100 = <b>84 %</b>. Donc oui.",
              // Erreur fréquente : confusion > 30 vs exactement 30 et conclusion erronée
              "Élèves ≥ 5 km : 27 + 23 + 21 + 13 = 84. Pourcentage : 84/257 ≈ 32,7 %. Comme 32,7 % > 30 %, <b>l'affirmation est fausse</b>."
            ],
            correctIdx: 0,
            correction: "<b>Démarche correcte</b> : 1) compter les élèves à <b>5 km ou plus</b> (donc 5 + 6 + 7 + 8 km) : 27 + 23 + 21 + 13 = 84. 2) diviser par l'<b>effectif total</b> (257) : 84/257 ≈ 0,327 = <b>32,7 %</b>. 3) comparer à 30 % : 32,7 > 30, donc <b>oui, l'affirmation est vraie</b>.<br><br><em>Pièges à éviter :</em><br>• <b>« Au moins 5 »</b> signifie <b>≥ 5</b>, pas « 5 ou moins ».<br>• Le dénominateur est <b>l'effectif total</b> (257), pas 100 ni 84.<br>• 32,7 % > 30 %, donc « plus de 30 % » est vrai (pas faux)."
          }
        ]
      },
      {
        id: 'ex2',
        titre: 'Exercice 2 — Programme de calcul',
        points: 3,
        competencesPrincipales: ['modeliser', 'calculer', 'communiquer'],
        contexte: "On donne un programme de calcul :<br><ol style='padding-left:22px;line-height:1.6;'><li>Choisir un nombre.</li><li>Le multiplier par 2.</li><li>Élever le résultat au carré.</li><li>Retrancher 9.</li><li>Afficher le résultat.</li></ol>",
        questions: [
          {
            // Q1 décomposée en étapes intermédiaires pour valoriser chaque calcul
            id: 'ex2-q1a',
            body: "On choisit <b>4</b> comme nombre de départ.<br><b>Étape 2</b> (« le multiplier par 2 ») : combien obtient-on ?",
            type: 'input',
            points: 0.25,
            competence: 'calculer',
            expected: ['8'],
            correction: "4 × 2 = <b>8</b>."
          },
          {
            id: 'ex2-q1b',
            body: "<b>Étape 3</b> (« élever le résultat au carré ») : combien obtient-on ?",
            type: 'input',
            points: 0.25,
            competence: 'calculer',
            expected: ['64'],
            correction: "8² = 8 × 8 = <b>64</b>.<br><em>Piège :</em> 8² n'est pas 8 × 2 = 16."
          },
          {
            id: 'ex2-q1c',
            body: "<b>Étape 4</b> (« retrancher 9 ») : quel est le résultat final ?",
            type: 'input',
            points: 0.25,
            competence: 'calculer',
            expected: ['55'],
            correction: "64 − 9 = <b>55</b>. ✓ Le programme affiche bien 55."
          },
          {
            id: 'ex2-q1d',
            body: "Comment <b>bien rédiger</b> cette vérification sur une copie de Brevet ? Choisir la meilleure présentation.",
            type: 'qcm',
            points: 0.25,
            competence: 'communiquer',
            choices: [
              // Bonne rédaction : étapes claires, connecteur, conclusion
              "« Étape 2 : 4 × 2 = 8. Étape 3 : 8² = 64. Étape 4 : 64 − 9 = 55. <b>Donc le programme affiche bien 55.</b> »",
              // Juste le résultat
              "« 55. »",
              // Calculs en vrac sans étapes
              "« 4 × 2 × 2 − 9 = 55. »",
              // Erreur fréquente : oubli du carré
              "« 4 × 2 = 8. 8 × 2 = 16. 16 − 9 = 7. » (donc ≠ 55)"
            ],
            correctIdx: 0,
            correction: "Une bonne rédaction « précise chaque étape » : on <b>numérote</b> ou on <b>énumère</b> les étapes, on <b>écrit les calculs</b> et on <b>conclut</b> par une phrase.<br><em>Piège fréquent :</em> confondre « élever au carré » (8² = 64) avec « multiplier par 2 » (8 × 2 = 16)."
          },
          {
            id: 'ex2-q2',
            body: "On appelle <b>x</b> le nombre choisi. Parmi ces expressions, laquelle donne le résultat du programme <b>en fonction de x</b> ?",
            type: 'qcm',
            points: 1,
            competence: 'modeliser',
            choices: [
              // Bonne réponse : (2x)² − 9
              '\\((2x)^2 - 9\\)',
              // Erreur : oubli des parenthèses autour de 2x (on carré que x)
              '\\(2x^2 - 9\\)',
              // Erreur : ordre des étapes inversé (retrancher 9 avant le carré)
              '\\((2x - 9)^2\\)',
              // Erreur : carré seulement sur x, multiplier tout par 2 à la fin
              '\\(2(x^2 - 9)\\)'
            ],
            correctIdx: 0,
            correction: "On suit le programme dans l'ordre :<br>• Étape 2 : on multiplie x par 2 → <b>2x</b> (avec parenthèses : (2x))<br>• Étape 3 : on élève le résultat <b>entier</b> au carré → <b>(2x)²</b>, pas seulement x².<br>• Étape 4 : on retranche 9 → <b>(2x)² − 9</b>.<br><em>Remarque :</em> (2x)² = 4x², donc le résultat peut aussi s'écrire <b>4x² − 9</b>."
          },
          {
            id: 'ex2-q3',
            body: "On a vu en Q2 que le résultat du programme est \\(4x^2 - 9\\).<br>Parmi les expressions suivantes, laquelle est <b>égale à</b> \\(4x^2 - 9\\) sous <b>forme factorisée</b> ?",
            type: 'qcm',
            points: 1,
            competence: 'raisonner',
            choices: [
              // Erreur : identité remarquable du carré de la somme
              '\\((2x + 3)^2\\)',
              // Bonne réponse : différence de deux carrés
              '\\((2x - 3)(2x + 3)\\)',
              // Erreur : identité remarquable du carré de la différence
              '\\((2x - 3)^2\\)',
              // Valeur numérique (qui dépend de x)
              '\\(55\\) (uniquement pour \\(x = 4\\))'
            ],
            correctIdx: 1,
            correction: "On reconnaît une <b>différence de deux carrés</b> : \\(4x^2 - 9 = (2x)^2 - 3^2\\).<br>Identité remarquable : \\(a^2 - b^2 = (a - b)(a + b)\\), avec \\(a = 2x\\) et \\(b = 3\\).<br>Donc \\(4x^2 - 9 = (2x - 3)(2x + 3)\\).<br><em>Pièges à éviter :</em><br>• \\((2x + 3)^2 = 4x^2 + 12x + 9\\) (il y a un terme en x, ce n'est pas égal).<br>• \\((2x - 3)^2 = 4x^2 - 12x + 9\\) (pareil, il y a un terme en x)."
          }
        ]
      },
      {
        id: 'ex3',
        titre: 'Exercice 3 — Fonctions',
        points: 3,
        competencesPrincipales: ['representer', 'calculer', 'raisonner'],
        contexte: "On considère les fonctions :<br>\\(f : x \\mapsto 4x + 3\\) &nbsp; et &nbsp; \\(g : x \\mapsto 6x\\).",
        questions: [
          {
            // Q1a : résultat direct (Calculer)
            id: 'ex3-q1a',
            body: "Parmi \\(f\\) et \\(g\\), <b>laquelle représente une situation de proportionnalité</b> ?",
            type: 'qcm',
            points: 0.25,
            competence: 'calculer',
            choices: [
              'La fonction \\(g\\)',
              'La fonction \\(f\\)',
              'Les deux fonctions',
              'Aucune des deux'
            ],
            correctIdx: 0,
            correction: "Une fonction linéaire (de la forme \\(x \\mapsto ax\\), sans terme constant) représente une proportionnalité. \\(g(x) = 6x\\) est linéaire → <b>c'est g</b>."
          },
          {
            // Q1b : justification (Raisonner)
            id: 'ex3-q1b',
            body: "Quelle <b>justification</b> est correcte ?",
            type: 'qcm',
            points: 0.5,
            competence: 'raisonner',
            choices: [
              // Bonne justification
              "\\(g\\) est linéaire car \\(g(x) = 6x\\) (forme \\(ax\\), sans terme constant). \\(f\\) est affine mais pas linéaire car elle a un terme constant \\(+3\\).",
              // Erreur fréquente : confondre proportionnalité et affine
              "\\(f\\) et \\(g\\) sont des fonctions affines, donc les deux représentent une proportionnalité.",
              // Erreur : se baser sur le coefficient 6 > 4
              "\\(g\\) car son coefficient (6) est plus grand que celui de \\(f\\) (4).",
              // Erreur : se baser sur l'image de 0
              "\\(g\\) car \\(g(0) = 0\\), donc la droite passe par l'origine."
            ],
            correctIdx: 0,
            correction: "<b>Règle :</b> une fonction représente une proportionnalité si et seulement si c'est une <b>fonction linéaire</b> \\(x \\mapsto ax\\) (pas de terme constant).<br>• \\(g(x) = 6x\\) : linéaire → proportionnalité ✓<br>• \\(f(x) = 4x + 3\\) : affine mais non linéaire (terme constant +3) → pas de proportionnalité.<br><em>Piège :</em> une fonction peut avoir \\(f(0) = 0\\) sans être linéaire (si on donne juste un point), mais ici le critère sûr c'est l'absence de terme constant."
          },
          {
            id: 'ex3-q2',
            body: "Calculer l'<b>image de 0</b> par la fonction \\(g\\).",
            type: 'input',
            points: 0.25,
            competence: 'calculer',
            expected: ['0'],
            correction: "\\(g(0) = 6 \\times 0 = 0\\)."
          },
          {
            // Q3a : résultat direct (Calculer)
            id: 'ex3-q3a',
            body: "Déterminer l'<b>antécédent de 0</b> par la fonction \\(f\\).",
            type: 'input',
            points: 0.5,
            competence: 'calculer',
            expected: ['-3/4', '-0,75', '-0.75'],
            correction: "On cherche \\(x\\) tel que \\(f(x) = 0\\), soit \\(4x + 3 = 0\\), d'où \\(x = -\\dfrac{3}{4} = -0{,}75\\)."
          },
          {
            // Q3b : démarche (Raisonner)
            id: 'ex3-q3b',
            body: "Quelle est la <b>démarche correcte</b> pour trouver cet antécédent ?",
            type: 'qcm',
            points: 0.5,
            competence: 'raisonner',
            choices: [
              // Bonne démarche
              "On cherche \\(x\\) tel que \\(f(x) = 0\\). On résout \\(4x + 3 = 0\\) : \\(4x = -3\\), donc \\(x = -\\dfrac{3}{4}\\).",
              // Erreur : confondre image et antécédent
              "On calcule \\(f(0) = 4 \\times 0 + 3 = 3\\). L'antécédent de 0 est 3.",
              // Erreur de signe classique
              "On résout \\(4x + 3 = 0\\) : \\(4x = 3\\), donc \\(x = \\dfrac{3}{4}\\).",
              // Erreur : diviser par le mauvais nombre
              "On résout \\(4x + 3 = 0\\), donc \\(x = \\dfrac{-3}{4+3} = -\\dfrac{3}{7}\\)."
            ],
            correctIdx: 0,
            correction: "<b>Antécédent de 0</b> = valeur de \\(x\\) telle que \\(f(x) = 0\\).<br>On résout \\(4x + 3 = 0\\) :<br>• Étape 1 : retrancher 3 des deux côtés → \\(4x = -3\\).<br>• Étape 2 : diviser par 4 → \\(x = -\\dfrac{3}{4} = -0{,}75\\).<br><em>Piège :</em> ne pas confondre <b>image</b> (on donne x, on cherche f(x)) et <b>antécédent</b> (on donne f(x), on cherche x)."
          },
          {
            id: 'ex3-q4',
            figure: svgRepere2Droites({ a1: 4, b1: 3, a2: 6, b2: 0, xMin: -1, xMax: 3, yMin: -2, yMax: 20, inter: [1.5, 9] }),
            body: "Les courbes représentatives \\((d_1)\\) et \\((d_2)\\) des fonctions \\(f\\) et \\(g\\) sont tracées dans le repère ci-dessus.<br><br><b>a)</b> Associer à chaque droite la fonction qu'elle représente. Quelle est l'association <b>justifiée</b> ?",
            type: 'qcm',
            points: 0.75,
            competence: 'raisonner',
            choices: [
              // Bonne réponse avec justification
              "\\((d_1)\\) = \\(f\\) et \\((d_2)\\) = \\(g\\), car \\((d_1)\\) coupe l'axe (Oy) en 3 (donc \\(b = 3\\)) et \\((d_2)\\) passe par l'origine (donc \\(b = 0\\)).",
              // Erreur : inversion
              "\\((d_1)\\) = \\(g\\) et \\((d_2)\\) = \\(f\\), car \\(g\\) a une pente plus grande.",
              // Erreur : se baser uniquement sur la pente
              "\\((d_1)\\) = \\(g\\) et \\((d_2)\\) = \\(f\\), car la droite la plus raide est la fonction linéaire.",
              // Erreur : on ne peut pas conclure
              "On ne peut pas associer les droites sans plus d'informations."
            ],
            correctIdx: 0,
            correction: "<b>Critère sûr : l'ordonnée à l'origine.</b><br>• \\(f(x) = 4x + 3\\) : la droite de \\(f\\) coupe l'axe (Oy) au point \\((0 \\,;\\, 3)\\).<br>• \\(g(x) = 6x\\) : la droite de \\(g\\) passe par l'origine \\((0 \\,;\\, 0)\\).<br>Sur la figure, \\((d_1)\\) passe par \\((0 \\,;\\, 3)\\) → c'est \\(f\\). \\((d_2)\\) passe par \\((0 \\,;\\, 0)\\) → c'est \\(g\\)."
          },
          {
            id: 'ex3-q5',
            body: "<b>b)</b> Les deux droites se coupent au point d'intersection. Quelles sont ses <b>coordonnées</b> ?",
            type: 'qcm',
            points: 0.25,
            competence: 'representer',
            choices: [
              '\\((1{,}5 \\,;\\, 9)\\)',
              '\\((9 \\,;\\, 1{,}5)\\)',
              '\\((3 \\,;\\, 0)\\)',
              '\\((0 \\,;\\, 3)\\)'
            ],
            correctIdx: 0,
            correction: "Par lecture graphique, les deux droites se coupent en \\((1{,}5 \\,;\\, 9)\\).<br>On peut vérifier par calcul : \\(f(1{,}5) = 4 \\times 1{,}5 + 3 = 9\\) et \\(g(1{,}5) = 6 \\times 1{,}5 = 9\\). ✓<br><em>Piège :</em> les coordonnées sont \\((x \\,;\\, y)\\) — pas \\((y \\,;\\, x)\\)."
          }
        ]
      },
      {
        id: 'ex4',
        titre: 'Exercice 4 — Octogone et disque',
        points: 3,
        competencesPrincipales: ['raisonner', 'calculer'],
        contexte: "ABCD est un <b>carré de côté 9 cm</b>. Les segments de même longueur sont codés (chaque côté du carré est divisé en 3 parts égales). On a construit l'<b>octogone IJKLMNOP</b> en reliant les 8 points obtenus.",
        figureCommune: svgCarreOctogoneDisque({ cote: 9, avecDisque: false, grise: true }),
        questions: [
          {
            id: 'ex4-q1',
            figure: svgCarreOctogoneDisque({ cote: 9, avecDisque: false, grise: true }),
            body: "<b>Figure :</b> carré ABCD de côté 9 cm, octogone IJKLMNOP grisé (sommets aux tiers des côtés).<br><br>Le polygone IJKLMNOP a-t-il tous ses côtés de même longueur (polygone <b>régulier</b>) ?<br>Quelle <b>justification</b> est correcte ?",
            type: 'qcm',
            points: 0.5,
            competence: 'raisonner',
            choices: [
              // Bonne réponse (distinction côtés droits vs côtés obliques)
              "<b>Non</b> : les côtés droits (parallèles aux bords) mesurent 3 cm, mais les côtés obliques mesurent \\(3\\sqrt{2} \\approx 4{,}24\\) cm. Ils ne sont pas tous égaux.",
              // Erreur : se fier à l'apparence visuelle
              "Oui, car un octogone inscrit dans un carré est toujours régulier.",
              // Erreur : confondre régulier avec « a 8 côtés »
              "Oui, car il a 8 côtés.",
              // Erreur : bon résultat mais mauvaise justification
              "Non, car ses côtés ne sont pas parallèles deux à deux."
            ],
            correctIdx: 0,
            correction: "Un polygone est <b>régulier</b> si <b>tous ses côtés ET tous ses angles</b> sont égaux. Ici, les 4 côtés droits (parallèles au carré) mesurent 3 cm et les 4 côtés obliques (hypoténuses des petits triangles rectangles de côtés 3) mesurent \\(3\\sqrt{2} \\approx 4{,}24\\) cm. Donc <b>non régulier</b>.<br><em>Piège :</em> « avoir 8 côtés » fait un octogone, mais pas forcément régulier."
          },
          {
            // Q2a : aire du carré (calcul mental rapide)
            id: 'ex4-q2a',
            body: "Pour justifier que l'aire de l'octogone IJKLMNOP est <b>63 cm²</b>, on décompose le calcul.<br><br>Quelle est l'aire du <b>carré ABCD</b> (en cm²) ?",
            type: 'input',
            points: 0.25,
            competence: 'calculer',
            expected: ['81'],
            correction: "Aire d'un carré de côté 9 : \\(9 \\times 9 = 9^2 = \\)<b>81 cm²</b>."
          },
          {
            // Q2b : aire d'un triangle retiré
            id: 'ex4-q2b',
            body: "Aux 4 coins du carré, on retire 4 <b>triangles rectangles isocèles</b> identiques. Leurs côtés de l'angle droit mesurent 3 cm.<br><br>Quelle est l'aire <b>d'un seul</b> de ces triangles (en cm²) ?",
            type: 'input',
            points: 0.25,
            competence: 'calculer',
            expected: ['4,5', '4.5', '9/2'],
            correction: "Aire d'un triangle rectangle = (base × hauteur) / 2 = (3 × 3) / 2 = <b>4,5 cm²</b>."
          },
          {
            // Q2c : conclusion (démarche de justification — Raisonner)
            id: 'ex4-q2c',
            body: "En déduire la <b>démarche correcte</b> pour justifier que l'aire de l'octogone est bien 63 cm².",
            type: 'qcm',
            points: 0.5,
            competence: 'raisonner',
            choices: [
              // Bonne démarche
              "Aire octogone = Aire carré − Aire des 4 triangles = 81 − 4 × 4,5 = 81 − 18 = <b>63 cm²</b>.",
              // Erreur : oublier de multiplier par 4
              "Aire octogone = 81 − 4,5 = 76,5 cm².",
              // Erreur : ajouter au lieu de retrancher
              "Aire octogone = 81 + 4 × 4,5 = 99 cm².",
              // Erreur : confondre avec l'aire d'un triangle
              "Aire octogone = 4 × 4,5 = 18 cm²."
            ],
            correctIdx: 0,
            correction: "<b>Principe :</b> l'octogone = le carré auquel on a <b>retiré 4 triangles</b> identiques.<br>Donc : Aire octogone = Aire carré − (4 × Aire d'un triangle) = 81 − 4 × 4,5 = 81 − 18 = <b>63 cm²</b>. ✓<br><em>Piège :</em> il y a <b>4</b> triangles à retirer (un à chaque coin)."
          },
          {
            id: 'ex4-q3',
            figure: svgCarreOctogoneDisque({ cote: 9, avecDisque: true, grise: true }),
            body: "Les diagonales du carré ABCD se coupent en S. On trace le cercle de centre S et de <b>diamètre 9 cm</b>.<br><br>Quelle est l'aire du disque, arrondie au <b>dixième</b> (en cm²) ?",
            type: 'input',
            points: 0.5,
            competence: 'calculer',
            expected: ['63,6', '63.6', '63,62', '63.62'],
            correction: "Rayon = diamètre / 2 = 9/2 = <b>4,5 cm</b>.<br>Aire du disque = \\(\\pi \\times r^2 = \\pi \\times 4{,}5^2 = 20{,}25\\pi \\approx\\) <b>63,6 cm²</b>."
          },
          {
            id: 'ex4-q4',
            body: "On veut montrer que la <b>différence d'aires</b> entre l'octogone (63 cm²) et le disque (63,6 cm²) représente <b>moins de 1 %</b> de l'aire du disque.<br><br>Quelle est la <b>démarche correcte</b> ?",
            type: 'qcm',
            points: 1,
            competence: 'communiquer',
            choices: [
              // Bonne démarche — aérée
              "Différence : 63,6 − 63 = <b>0,6 cm²</b>.<br>Pourcentage par rapport au disque : 0,6 ÷ 63,6 ≈ <b>0,94 %</b>.<br>Comme 0,94 % &lt; 1 %, <b>c'est vérifié</b>.",
              // Erreur : rapporter au polygone
              "Différence : 0,6 cm².<br>Pourcentage par rapport à l'octogone : 0,6 ÷ 63 ≈ 0,95 %.",
              // Erreur : oublier de diviser par l'aire
              "Différence : 0,6 cm².<br>0,6 &lt; 1, donc c'est moins de 1 %.",
              // Erreur : prendre 63 − 63,6 sans valeur absolue
              "Différence : 63 − 63,6 = −0,6 cm².<br>Négatif, donc l'affirmation est fausse."
            ],
            correctIdx: 0,
            correction: "<b>3 étapes :</b><br>1️⃣ Différence (positive) : 63,6 − 63 = <b>0,6 cm²</b>.<br>2️⃣ La rapporter à l'aire <b>du disque</b> : 0,6 ÷ 63,6.<br>3️⃣ Convertir en % : ≈ <b>0,94 %</b>. Comme 0,94 % &lt; 1 %, <b>c'est vérifié</b>. ✓<br><br><em>Piège principal :</em> c'est bien <b>l'aire du disque</b> qui sert de référence (dénominateur = 63,6), pas celle de l'octogone."
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
