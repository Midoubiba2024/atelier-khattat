  // ------------------------------------------------------------------ bibliothèque de textes
  // [texte arabe, sens ou transcription en français]
  const LIBRARY = [
    { id: 'formules', fr: 'Formules', items: [
      ['بسم الله الرحمن الرحيم', 'Au nom de Dieu, le Tout Miséricordieux, le Très Miséricordieux'],
      ['بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ', 'La basmala, entièrement vocalisée'],
      ['الحمد لله', 'Louange à Dieu'], ['سبحان الله', 'Gloire à Dieu'], ['الله أكبر', 'Dieu est le plus grand'],
      ['لا إله إلا الله', 'Il n’y a de dieu que Dieu'], ['ما شاء الله', 'Ce que Dieu a voulu'], ['إن شاء الله', 'Si Dieu le veut'],
      ['بارك الله فيك', 'Que Dieu te bénisse'], ['جزاك الله خيرا', 'Que Dieu te récompense par le bien'], ['توكلت على الله', 'Je m’en remets à Dieu'],
      ['أستغفر الله', 'Je demande pardon à Dieu'], ['لا حول ولا قوة إلا بالله', 'Il n’y a de force ni de puissance qu’en Dieu'],
      ['سبحان الله وبحمده', 'Gloire et louange à Dieu'], ['السلام عليكم ورحمة الله وبركاته', 'Que la paix, la miséricorde de Dieu et Ses bénédictions soient sur vous'],
      ['الله', 'Allah'], ['محمد رسول الله', 'Muhammad est le messager de Dieu']
    ] },
    { id: 'versets', fr: 'Versets courts', items: [
      ['إِنَّ مَعَ الْعُسْرِ يُسْرًا', 'Avec la difficulté vient la facilité (Coran 94:6)'],
      ['وَمَا تَوْفِيقِي إِلَّا بِاللَّهِ', 'Ma réussite ne dépend que de Dieu (Coran 11:88)'],
      ['رَبِّ زِدْنِي عِلْمًا', 'Seigneur, accrois ma science (Coran 20:114)'],
      ['حَسْبُنَا اللَّهُ وَنِعْمَ الْوَكِيلُ', 'Dieu nous suffit, Il est notre meilleur garant (Coran 3:173)'],
      ['أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ', 'C’est par l’évocation de Dieu que les cœurs s’apaisent (Coran 13:28)'],
      ['وَهُوَ مَعَكُمْ أَيْنَ مَا كُنتُمْ', 'Il est avec vous où que vous soyez (Coran 57:4)'],
      ['فَاذْكُرُونِي أَذْكُرْكُمْ', 'Souvenez-vous de Moi, Je Me souviendrai de vous (Coran 2:152)'],
      ['إِنَّ اللَّهَ مَعَ الصَّابِرِينَ', 'Dieu est avec les patients (Coran 2:153)'],
      ['وَاللَّهُ خَيْرُ الرَّازِقِينَ', 'Dieu est le meilleur des pourvoyeurs (Coran 62:11)'],
      ['اللَّهُ نُورُ السَّمَاوَاتِ وَالْأَرْضِ', 'Dieu est la lumière des cieux et de la terre (Coran 24:35)'],
      ['قُلْ هُوَ اللَّهُ أَحَدٌ', 'Dis : Il est Dieu, Unique (Coran 112:1)'],
      ['وَلَسَوْفَ يُعْطِيكَ رَبُّكَ فَتَرْضَىٰ', 'Ton Seigneur t’accordera Ses faveurs, et tu seras satisfait (Coran 93:5)'],
      ['وَجَعَلْنَا مِنَ الْمَاءِ كُلَّ شَيْءٍ حَيٍّ', 'De l’eau Nous avons fait toute chose vivante (Coran 21:30)'],
      ['هَٰذَا مِن فَضْلِ رَبِّي', 'Ceci est une grâce de mon Seigneur (Coran 27:40)'],
      ['وَقُل رَّبِّ ارْحَمْهُمَا كَمَا رَبَّيَانِي صَغِيرًا', 'Seigneur, fais-leur miséricorde comme ils m’ont élevé tout petit (Coran 17:24)'],
      ['رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً', 'Seigneur, accorde-nous une belle part ici-bas et dans l’au-delà (Coran 2:201)'],
      ['رَبَّنَا هَبْ لَنَا مِنْ أَزْوَاجِنَا وَذُرِّيَّاتِنَا قُرَّةَ أَعْيُنٍ', 'Seigneur, fais de nos épouses et de nos enfants la joie de nos yeux (Coran 25:74)']
    ] },
    { id: 'voeux', fr: 'Vœux et fêtes', items: [
      ['عيد مبارك', 'Bonne fête de l’Aïd'], ['عيد سعيد', 'Joyeuse fête'], ['عيد أضحى مبارك', 'Bonne fête de l’Aïd al-Adha'],
      ['رمضان كريم', 'Ramadan généreux'], ['رمضان مبارك', 'Ramadan béni'], ['كل عام وأنتم بخير', 'Bonne année à vous, vœu de toutes les fêtes'],
      ['تقبل الله منا ومنكم', 'Que Dieu accepte nos œuvres et les vôtres'], ['مبروك', 'Félicitations'], ['ألف مبروك', 'Mille félicitations'],
      ['عيد ميلاد سعيد', 'Joyeux anniversaire'], ['سنة سعيدة', 'Bonne année'], ['حج مبرور', 'Pèlerinage agréé'],
      ['بالرفاء والبنين', 'Vœu de mariage : entente et descendance'], ['بارك الله لكما وبارك عليكما', 'Que Dieu vous bénisse tous les deux (vœu aux mariés)'],
      ['أهلاً وسهلاً', 'Bienvenue'], ['مرحباً', 'Bonjour, bienvenue'], ['شكراً', 'Merci'], ['الحمد لله على السلامة', 'Heureux de vous voir sain et sauf']
    ] },
    { id: 'mots', fr: 'Mots et valeurs', items: [
      ['حب', 'Amour'], ['سلام', 'Paix'], ['أمل', 'Espoir'], ['صبر', 'Patience'], ['نور', 'Lumière'], ['حرية', 'Liberté'],
      ['سعادة', 'Bonheur'], ['إيمان', 'Foi'], ['رحمة', 'Miséricorde'], ['حكمة', 'Sagesse'], ['علم', 'Savoir'], ['كرم', 'Générosité'],
      ['وفاء', 'Fidélité'], ['جمال', 'Beauté'], ['قوة', 'Force'], ['تواضع', 'Humilité'], ['سكينة', 'Sérénité'], ['بركة', 'Bénédiction'],
      ['الخط العربي', 'La calligraphie arabe'], ['فن', 'Art'], ['وطن', 'Patrie'], ['أم', 'Mère'], ['أب', 'Père'], ['عائلة', 'Famille']
    ] },
    { id: 'garcons', fr: 'Prénoms de garçons', items: [
      ['محمد', 'Mohammed'], ['أحمد', 'Ahmed'], ['علي', 'Ali'], ['يوسف', 'Youssef'], ['عمر', 'Omar'], ['آدم', 'Adam'],
      ['إبراهيم', 'Ibrahim'], ['ياسين', 'Yassine'], ['حمزة', 'Hamza'], ['إلياس', 'Ilyès'], ['كريم', 'Karim'], ['سليمان', 'Soulaymane'],
      ['ريان', 'Rayane'], ['أمين', 'Amine'], ['زكرياء', 'Zakaria'], ['عثمان', 'Othmane'], ['بلال', 'Bilal'], ['مصطفى', 'Moustafa'],
      ['خالد', 'Khaled'], ['حمادي', 'Hamadi'], ['سامي', 'Sami'], ['نور الدين', 'Noureddine'], ['عبد الله', 'Abdallah'], ['إسماعيل', 'Ismaïl'], ['أنس', 'Anas']
    ] },
    { id: 'filles', fr: 'Prénoms de filles', items: [
      ['مريم', 'Maryam'], ['فاطمة', 'Fatima'], ['عائشة', 'Aïcha'], ['خديجة', 'Khadija'], ['ليلى', 'Leïla'], ['سارة', 'Sarah'],
      ['نور', 'Nour'], ['ياسمين', 'Yasmine'], ['إيناس', 'Inès'], ['هند', 'Hind'], ['سلمى', 'Salma'], ['لينا', 'Lina'],
      ['آية', 'Aya'], ['زينب', 'Zineb'], ['سعاد', 'Souad'], ['أمينة', 'Amina'], ['رانيا', 'Rania'], ['صفية', 'Safia'],
      ['هاجر', 'Hajar'], ['نادية', 'Nadia'], ['سلوى', 'Salwa'], ['جميلة', 'Jamila'], ['لمياء', 'Lamia'], ['دنيا', 'Donia'], ['مليكة', 'Malika']
    ] },
    { id: 'maison', fr: 'Maison et famille', items: [
      ['بيتي جنتي', 'Ma maison est mon paradis'], ['أهلاً بكم في بيتنا', 'Bienvenue chez nous'], ['اللهم بارك في هذا البيت', 'Seigneur, bénis cette maison'],
      ['الجنة تحت أقدام الأمهات', 'Le paradis est sous les pieds des mères'], ['العائلة نعمة', 'La famille est une grâce'], ['البيت السعيد', 'La maison heureuse']
    ] },
    { id: 'proverbes', fr: 'Proverbes et poésie', items: [
      ['العلم نور', 'Le savoir est lumière'], ['الصبر مفتاح الفرج', 'La patience est la clé du soulagement'], ['من جد وجد', 'Qui s’applique réussit'],
      ['الوقت كالسيف', 'Le temps est comme un sabre'], ['خير الكلام ما قل ودل', 'La meilleure parole est brève et juste'], ['القناعة كنز لا يفنى', 'La sobriété est un trésor inépuisable'],
      ['لكل مجتهد نصيب', 'Tout effort a sa récompense'], ['الصديق وقت الضيق', 'L’ami se révèle dans l’épreuve'], ['يد واحدة لا تصفق', 'Une seule main ne peut applaudir'],
      ['اطلبوا العلم من المهد إلى اللحد', 'Cherchez le savoir du berceau à la tombe'],
      ['الخيل والليل والبيداء تعرفني\nوالسيف والرمح والقرطاس والقلم', 'Al-Mutanabbi (Xe siècle) : « Les chevaux, la nuit et le désert me connaissent, et le sabre, la lance, le papier et la plume »'],
      ['دع الأيام تفعل ما تشاء\nوطب نفسا إذا حكم القضاء', 'Al-Shāfiʿī (IXe siècle) : « Laisse les jours faire ce qu’ils veulent, et garde l’âme sereine quand le destin décide »']
    ] }
  ];

  // ------------------------------------------------------------------ modèles de tableaux (compositions originales)
  const MTHEMES = [
    ['all', 'Tous', 'Toutes les compositions : chaque aperçu est dessiné par l’atelier avec votre phrase ou avec l’exemple du modèle.'],
    ['classique', 'Tableaux classiques', 'Les grands genres de la calligraphie : shamsa, levha, musanna, mihrab, qitʿa, page enluminée.'],
    ['medaillon', 'Médaillons et sceaux', 'Compositions circulaires et fermées : médaillons, sceaux, rosaces, étoiles, couronnes.'],
    ['compositions', 'Compositions', 'La phrase organise tout le tableau : pyramide, œuf, goutte, médaillons en anneaux, mosaïques de tuiles, rosaces en miroir, tughra, hilye.'],
    ['versets', 'Versets et invocations', 'Pour une invocation ou un verset court, avec des compositions sobres et lisibles.'],
    ['prenoms', 'Prénoms', 'Pour un prénom : cœur, relief, néon, miroir, autocollant, pastel.'],
    ['fetes', 'Fêtes et vœux', 'Cartes de vœux : Aïd, Ramadan, anniversaire, nouvel an, félicitations.'],
    ['mariage', 'Mariage et famille', 'Vœux aux mariés, prénoms du couple, bénédiction de la maison.'],
    ['geometrique', 'Géométrique', 'Zellige, mosaïque, arabesque : la phrase au cœur d’un décor géométrique.'],
    ['moderne', 'Moderne', 'Affiche, néon, pixel, relief, minimal : des compositions contemporaines.'],
    ['decoupe', 'Découpe et gravure', 'Pensés pour la découpe laser, le vinyle, la gravure et les enseignes (fichiers SVG découpe et DXF).'],
    ['mine', 'Mes modèles', 'Vos modèles : vos réglages enregistrés et les styles imités d’après vos images.']
  ];
  const MODELS = [];
  function M(theme, id, name, note, ex, look) { MODELS.push({ theme, id, name, note, ex, look }); }
  const SHADOW = (o, d, b) => ({ on: true, color: '#000000', opacity: o, dist: d, blur: b });
  // Tableaux classiques
  M('classique', 'shamsa', 'Shamsa dorée', 'Le « petit soleil » des frontispices : la phrase tourne en cercle d’or sur fond noir, bordée d’un double filet.', 'بسم الله الرحمن الرحيم',
    { font: 'layla-thuluth', shape: { type: 'circle', cover: 96, ring: 'double', ringW: 6 }, fill: LIN(GOLD2), bg: RAD(['#262626', '#000000']), shadow: SHADOW(0.5, 3, 6), format: 'square' });
  M('classique', 'levha', 'Levha ottomane', 'Panneau horizontal des mosquées ottomanes : une ligne de thuluth en or sur vert profond, dans un double filet.', 'الحمد لله',
    { font: 'layla-thuluth', fill: LIN(GOLD), bg: SOL('#0B3B2E'), fx: { weight: 0.8 }, frame: { type: 'rect', width: 1.4, double: true, pad: 20, fit: 'page' }, format: 'banner' });
  M('classique', 'musanna', 'Musanna (miroir)', 'La phrase se reflète sur elle-même autour d’un axe : une symétrie très prisée des calligraphes ottomans, ici dans un médaillon.', 'ما شاء\nالله',
    { font: 'aref-ruqaa-bold', align: 'left', shape: { repeat: 'mirror', mgap: 2 }, fill: SOL('#1B1712'), bg: LIN(PARCH), frame: { type: 'circle', width: 1.4, double: true, pad: 14 }, format: 'square' });
  M('classique', 'mihrab', 'Mihrab', 'La niche de prière : l’arc brisé encadre la phrase, sur un fond lapis semé d’étoiles.', 'الله نور\nالسماوات\nوالأرض',
    { font: 'amiri-bold', fill: LIN(GOLD2), bg: SOL('#0E1A3A'), frame: { type: 'arch', width: 1.8, double: true, pad: 18 }, pattern: { type: 'stars8', color: '#c9a227', opacity: 0.12, scale: 10 }, format: 'portrait' });
  M('classique', 'qita', 'Qitʿa à deux lignes', 'Petit panneau de deux lignes sur papier crème, voyelles à l’encre rouge comme dans les cahiers des maîtres.', 'اَلْعِلْمُ نُورٌ\nوَالْجَهْلُ ظَلَامٌ',
    { font: 'kitab-bold', fill: SOL('#1B1712'), bg: SOL('#F4EAD5'), fx: { marks: { on: true, color: '#b3261e' } }, frame: { type: 'rect', width: 1, pad: 20 }, lineHeight: 1.45, harakat: true, format: 'portrait' });
  M('classique', 'enluminure', 'Page enluminée', 'Or en dégradé, points et voyelles à l’encre rouge, cartouche à double filet : l’esprit des manuscrits enluminés.', 'وَقُلْ رَبِّ زِدْنِي عِلْمًا',
    { font: 'amiri-bold', fill: LIN(GOLD2), bg: LIN(PARCH), fx: { marks: { on: true, color: '#b3261e' }, dots: { on: true, color: '#b3261e' } }, frame: { type: 'cartouche', width: 1.6, double: true, pad: 18 }, harakat: true, format: 'landscape' });
  M('classique', 'kufi-ancien', 'Inscription koufique', 'Les lettres anguleuses des premières inscriptions, terre cuite sur pierre de sable.', 'الملك لله',
    { font: 'qahiri', fill: SOL('#8C3B1F'), bg: SOL('#E8D5B0'), frame: { type: 'rect', width: 2, pad: 14 }, pattern: { type: 'hex', color: '#8c3b1f', opacity: 0.08, scale: 8 }, format: 'landscape' });
  M('classique', 'maghribi', 'Maghribi andalou', 'L’écriture d’Afrique du Nord et d’Andalousie, encre brune sur papier ancien, points rouges.', 'بسم الله الرحمن الرحيم',
    { font: 'bouazzi-maghribi', fill: SOL('#2B2118'), bg: LIN(['#F4E8CF', '#E3CFA2']), fx: { dots: { on: true, color: '#a8321e' } }, frame: { type: 'round', width: 1.2, pad: 16 }, format: 'landscape' });
  M('classique', 'diwani', 'Diwani impérial', 'L’écriture des firmans ottomans, enlacée et légèrement cintrée, en or sur bordeaux, dans un cartouche à double filet.', 'توكلت على الله',
    { font: 'layla-diwani', fx: { weight: 1.5 }, shape: { type: 'bridge', height: 30 }, fill: LIN(GOLD2), bg: RAD(['#6B1A2C', '#2A0810']), frame: { type: 'cartouche', width: 1.6, double: true, pad: 16 }, format: 'landscape' });
  M('classique', 'nastaliq', 'Nastaʿlīq persan', 'L’écriture suspendue des poètes persans, sur papier crème moucheté d’or.', 'الصبر مفتاح الفرج',
    { font: 'gulzar', fill: SOL('#22303C'), bg: RAD(['#FBF6EC', '#EFE2C8']), pattern: { type: 'dots', color: '#b08a52', opacity: 0.18, scale: 5 }, frame: { type: 'round', width: 1, pad: 18 }, format: 'landscape' });
  // Médaillons et sceaux
  M('medaillon', 'medaillon-or', 'Médaillon d’or', 'Un seul mot au centre d’un médaillon double, or sur noir : pour le nom de Dieu ou un prénom.', 'الله',
    { font: 'aref-ruqaa-bold', fill: LIN(GOLD2), bg: SOL('#0D0D0D'), frame: { type: 'circle', width: 2, double: true, pad: 30 }, shadow: SHADOW(0.6, 4, 8), format: 'square' });
  M('medaillon', 'sceau', 'Sceau à trois lignes', 'Le sceau classique : la première ligne suit le haut du cercle, la dernière le bas, celle du milieu au centre.', 'بسم الله\nالرحمن\nالرحيم',
    { font: 'reem-kufi-bold', shape: { type: 'seal', cover: 70, ring: 'double', ringW: 7, sep: 'star' }, fill: SOL('#B3261E'), bg: NONE, format: 'square' });
  M('medaillon', 'rosace', 'Rosace', 'La phrase répétée en couronne autour d’un centre, comme une fleur de céramique.', 'الله',
    { font: 'kufam-black', shape: { repeat: 'rosette', copies: 8, spread: 100 }, fill: LIN(['#1BA3A3', '#0F5E4A']), bg: SOL('#FFF8E7'), format: 'square' });
  M('medaillon', 'etoile', 'Étoile à huit branches', 'Le khatam des zelliges et des plafonds : la phrase au cœur d’une étoile à huit branches.', 'سلام',
    { font: 'amiri-bold', fill: LIN(GOLD), bg: SOL('#0B4F4A'), frame: { type: 'star8', width: 2, double: true, pad: 26 }, pattern: { type: 'stars8', color: '#e3c06a', opacity: 0.1, scale: 10 }, format: 'square' });
  M('medaillon', 'couronne', 'Couronne de louanges', 'Une longue formule qui fait tout le tour du cercle, bordée d’un filet.', 'سبحان الله والحمد لله ولا إله إلا الله والله أكبر',
    { font: 'amiri', shape: { type: 'circle', cover: 100, ring: 'single', ringW: 5 }, fill: SOL('#1B1712'), bg: SOL('#FFFFFF'), format: 'square' });
  M('medaillon', 'alhambra', 'Hexagone de l’Alhambra', '« Il n’y a de vainqueur que Dieu », la devise des Nasrides gravée partout à l’Alhambra, en kufi sur un hexagone.', 'لا غالب إلا الله',
    { font: 'reem-kufi-bold', shape: { type: 'polygon', sides: 6, round: 25, cover: 85, ring: 'single', ringW: 6 }, fill: SOL('#1E3A8A'), bg: SOL('#F6F1E7'), format: 'square' });
  M('medaillon', 'ovale', 'Cartouche ovale', 'Une invocation qui fait le tour d’un ovale à double bordure, blanc sur lapis.', 'الحمد لله رب العالمين الرحمن الرحيم مالك يوم الدين',
    { font: 'aref-ruqaa', shape: { type: 'oval', cover: 90, ratio: 60, ring: 'double', ringW: 6 }, fill: SOL('#FFFFFF'), bg: SOL('#1E3A8A'), format: 'landscape' });
  // Compositions : la phrase organise tout le tableau
  M('compositions', 'pyramide', 'Pyramide', 'Les lignes s’empilent dans un triangle, de plus en plus larges vers la base : chacune prend toute la largeur disponible à sa hauteur.', 'وَمَا تَوْفِيقِي\nإِلَّا بِاللَّهِ\nعَلَيْهِ تَوَكَّلْتُ\nوَإِلَيْهِ أُنِيبُ',
    { font: 'layla-thuluth', shape: { type: 'fill', fillShape: 'tri', grow: 100, stretch: 25, lead: 12, ring: 'single', ringW: 5 }, fill: LIN(GOLD2), bg: SOL('#0B3B2E'), harakat: true, format: 'portrait' });
  M('compositions', 'oeuf', 'Œuf', '« Avec la difficulté vient la facilité », deux fois, dans un œuf à double bordure : la forme se remplit ligne par ligne.', 'فَإِنَّ مَعَ الْعُسْرِ يُسْرًا\nإِنَّ مَعَ الْعُسْرِ يُسْرًا',
    { font: 'aref-ruqaa-bold', shape: { type: 'fill', fillShape: 'egg', grow: 60, stretch: 10, lead: 18, ring: 'double', ringW: 5 }, fill: SOL('#1E3A8A'), bg: SOL('#FBF6EA'), harakat: true, format: 'portrait' });
  M('compositions', 'ovale-rempli', 'Ovale rempli', 'Trois lignes qui épousent un ovale : la ligne du milieu, la plus large, porte le cœur du verset.', 'كُلُّ مَنْ عَلَيْهَا فَانٍ\nوَيَبْقَىٰ وَجْهُ رَبِّكَ\nذُو الْجَلَالِ وَالْإِكْرَامِ',
    { font: 'amiri-bold', shape: { type: 'fill', fillShape: 'oval', grow: 50, stretch: 10, lead: 16, ring: 'double', ringW: 5 }, fill: LIN(GOLD2), bg: SOL('#14274E'), harakat: true, format: 'landscape' });
  M('compositions', 'goutte', 'Goutte', 'La forme en poire des compositions ottomanes : le texte se loge dans la partie ronde, la pointe s’élève au-dessus.', 'وَلَقَدْ كَرَّمْنَا\nبَنِي آدَمَ\nوَحَمَلْنَاهُمْ فِي الْبَرِّ وَالْبَحْرِ',
    { font: 'mirza-bold', shape: { type: 'fill', fillShape: 'drop', grow: 60, stretch: 10, ring: 'single', ringW: 6 }, fill: SOL('#5B3A1E'), bg: LIN(['#F6EBD3', '#E9D3A6']), harakat: true, format: 'portrait' });
  M('compositions', 'cercle-louanges', 'Cercle de louanges', 'Une longue formule répartie toute seule en lignes qui remplissent un cercle.', 'سبحان الله والحمد لله ولا إله إلا الله والله أكبر',
    { font: 'aref-ruqaa-bold', shape: { type: 'fill', fillShape: 'circle', wrap: 'auto', grow: 50, stretch: 10, lead: 14, ring: 'single', ringW: 5 }, fill: SOL('#7A1F3D'), bg: SOL('#FFF7EC'), format: 'square' });
  M('compositions', 'medaillon-noms', 'Médaillon des noms', 'Le nom de Dieu au centre, des noms divins en anneaux concentriques, séparés par des étoiles et des filets d’or.', 'الله\nالرحمن الرحيم الملك القدوس السلام\nالمؤمن المهيمن العزيز الجبار المتكبر الخالق البارئ المصور\nالغفار القهار الوهاب الرزاق الفتاح العليم القابض الباسط الخافض الرافع',
    { font: 'amiri-bold', shape: { type: 'rings', center: 1, rgap: 14, rlines: 'thin', sep: 'star', ring: 'double', ringW: 5 }, fill: LIN(GOLD2), bg: SOL('#0E1A3A'), format: 'square' });
  M('compositions', 'couronne-trone', 'Couronne du Trône', 'Le verset du Trône : son début au centre, la suite en trois anneaux qui l’entourent.', 'الله لا إله إلا هو\nالحي القيوم\nلا تأخذه سنة ولا نوم له ما في السماوات وما في الأرض\nمن ذا الذي يشفع عنده إلا بإذنه يعلم ما بين أيديهم وما خلفهم\nولا يحيطون بشيء من علمه إلا بما شاء وسع كرسيه السماوات والأرض ولا يئوده حفظهما وهو العلي العظيم',
    { font: 'amiri-bold', shape: { type: 'rings', center: 2, rgap: 12, rlines: 'thin', sep: 'dot', ring: 'single', ringW: 5 }, fill: SOL('#14341F'), bg: LIN(['#F6EEDB', '#E8D8B4']), format: 'square' });
  M('compositions', 'vertus', 'Mosaïque des vertus', 'Un titre, puis une phrase par tuile, aux couleurs pastel : ici, des préceptes du Coran sur le bon comportement.', 'مكارم الأخلاق في القرآن\nوقولوا للناس حسنا\nولا تجسسوا\nوأوفوا الكيل\nادفع بالتي هي أحسن\nولا تمش في الأرض مرحا\nواخفض جناحك للمؤمنين\nوتعاونوا على البر والتقوى\nاعدلوا هو أقرب للتقوى\nوقولوا قولا سديدا\nخذ العفو',
    { font: 'amiri-bold', shape: { type: 'tiles', tile: 'capsule', title: 'top', palette: 'pastel', tgap: 12, ring: 'single' }, fill: SOL('#3B2A20'), bg: SOL('#FFFDF7'), format: 'portrait' });
  M('compositions', 'beaux-noms', 'Les beaux noms', 'Des noms divins dans des arcs pastel, le nom de Dieu dans le grand arc du centre.', 'الله\nالرحمن\nالرحيم\nالملك\nالقدوس\nالسلام\nالمؤمن\nالمهيمن\nالعزيز\nالجبار\nالمتكبر\nالخالق\nالبارئ\nالمصور\nالغفار\nالقهار\nالوهاب\nالرزاق\nالفتاح\nالعليم\nالقابض\nالباسط\nالخافض\nالرافع\nالمعز',
    { font: 'aref-ruqaa-bold', shape: { type: 'tiles', tile: 'arch', title: 'center', palette: 'pastel', fratio: 70, tgap: 10, ring: 'single' }, fill: SOL('#2C2A4A'), bg: SOL('#FFFFFF'), format: 'square' });
  M('compositions', 'jumelles', 'Cartouches jumelles', 'Deux versets, chacun dans son cartouche : séparez les paragraphes par une ligne vide.', 'الحمد لله الذي له ما في السماوات\nوما في الأرض وله الحمد في الآخرة\nوهو الحكيم الخبير\n\nيعلم ما يلج في الأرض وما يخرج منها\nوما ينزل من السماء وما يعرج فيها\nوهو الرحيم الغفور',
    { font: 'layla-thuluth', shape: { type: 'tiles', tile: 'capsule', title: 'none', palette: 'none', cols: 1, tgap: 14, ring: 'single' }, fill: SOL('#111111'), bg: SOL('#FFFFFF'), format: 'landscape' });
  M('compositions', 'rosace-miroir', 'Rosace en miroir', 'La phrase rayonne depuis le centre, une copie sur deux en miroir : une fleur à huit pétales.', 'يا الله',
    { font: 'layla-thuluth', shape: { repeat: 'kaleido', copies: 8, spread: 75 }, fill: SOL('#FFFFFF'), bg: SOL('#8FA38A'), format: 'square' });
  M('compositions', 'contre-formes', 'Contre-formes', 'Un mot en grand, l’intérieur de ses boucles en blanc, sur un semis de points du calame en couleurs.', 'هو',
    { font: 'layla-diwani', fx: { counters: { on: true, color: '#FFFFFF' } }, fill: SOL('#111111'), bg: SOL('#E8D5B0'), pattern: { type: 'nuqat', color: '#111111', opacity: 0.85, scale: 9, colorful: true }, format: 'square' });
  M('compositions', 'tughra', 'Tughra', 'Le monogramme des sultans ottomans, réinventé pour un nom : les hampes s’élancent, deux boucles s’ouvrent à gauche, deux traits filent vers la droite. Écrivez votre nom sur la 1re ligne.', 'عبد الله\nالمظفر دائما',
    { font: 'layla-thuluth', shape: { type: 'tughra', height: 60 }, fill: LIN(GOLD2), bg: RAD(['#1B2A5C', '#070B1A']), format: 'landscape' });
  M('compositions', 'medaillon-ailes', 'Médaillon ailé', 'La basmala en trois parties : « Bismi-llāh » dans un médaillon, « ar-Raḥmān » et « ar-Raḥīm » en ailes turquoise, reliées par un long trait.', 'بسم الله\nالرحمن\nالرحيم',
    { font: 'layla-thuluth', shape: { type: 'wings', ring: 'single', ringW: 8, swash: 'on' }, fill: SOL('#7A3B1E'), lineInk: ['#7A3B1E', '#1F7A7A', '#1F7A7A'], bg: SOL('#FBF6EA'), format: 'banner' });
  M('compositions', 'lettres-semees', 'Lettres semées', 'Un mot en grand, et tout autour les lettres de l’alphabet semées en petit, à l’encre carmin.', 'روائع',
    { font: 'aref-ruqaa-bold', fx: { scatter: { on: true, color: '#9B2C4A', density: 60, size: 22, alpha: true } }, fill: SOL('#1B1712'), bg: SOL('#FFFFFF'), format: 'square' });
  M('compositions', 'hilye', 'Panneau hilye', 'D’après le plan des hilye ottomanes : bandeau, rond central dans son croissant, quatre médaillons d’angle, bandeau du verset, panneau du bas ; une ligne par compartiment.', 'بسم الله الرحمن الرحيم\nوَإِنَّكَ لَعَلَىٰ خُلُقٍ عَظِيمٍ\nأبو بكر\nعمر\nعثمان\nعلي\nوَمَا أَرْسَلْنَاكَ إِلَّا رَحْمَةً لِّلْعَالَمِينَ\nصلى الله عليه وسلم',
    { font: 'layla-thuluth', shape: { type: 'hilye', palette: 'gold' }, fill: SOL('#1B1712'), bg: SOL('#3B2A1A'), harakat: true, format: 'portrait' });
  // Versets : couleurs et fonds
  M('versets', 'iqra', 'Iqraʾ', '« Lis, au nom de ton Seigneur » : thuluth d’or aux voyelles turquoise, sur nuit.', 'اقْرَأْ\nبِاسْمِ رَبِّكَ',
    { font: 'layla-thuluth', fill: LIN(GOLD2), bg: RAD(['#14234A', '#060B1C']), fx: { marks: { on: true, color: '#2BB3A8' } }, lineHeight: 1.1, harakat: true, shadow: SHADOW(0.45, 3, 6), format: 'portrait' });
  M('versets', 'savoir', 'Rabbi zidni ʿilma', '« Seigneur, accrois ma science » en dégradé de nuit étoilée, dans un cercle blanc au filet pointillé.', 'وَقُل\nرَّبِّ زِدْنِي عِلْمًا',
    { font: 'layla-thuluth', lineHeight: 0.95, fill: LIN(['#3B1E6E', '#6A3FB3', '#2E5FD0', '#22A6D8'], 0), bg: SOL('#F4ECD8'), frame: { type: 'circle', width: 2.6, pad: 10, ink: false, color: '#B9AE96', panelOn: true, panel: '#ffffff', dash: true }, harakat: true, format: 'square' });
  M('versets', 'fond-partage', 'Fond partagé', 'Diwani noir sur un fond coupé en deux, or et gris bleuté.', 'أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ',
    { font: 'layla-diwani', fx: { weight: 0.8 }, fill: SOL('#111111'), bg: { type: 'linear', stops: [{ c: '#D9B65C', p: 0 }, { c: '#D9B65C', p: 0.5 }, { c: '#9AA7B6', p: 0.5 }, { c: '#9AA7B6', p: 1 }], angle: 120 }, harakat: true, format: 'landscape' });
  M('versets', 'nuit-et-or', 'Nuit et or', 'Thuluth blanc sur un fond noir et or, semé de points colorés.', 'لَا إِلَٰهَ إِلَّا أَنتَ سُبْحَانَكَ\nإِنِّي كُنتُ مِنَ الظَّالِمِينَ',
    { font: 'layla-thuluth', fill: SOL('#FFFFFF'), bg: { type: 'linear', stops: [{ c: '#111111', p: 0 }, { c: '#111111', p: 0.62 }, { c: '#C9A227', p: 0.62 }, { c: '#E3C06A', p: 1 }], angle: 160 }, pattern: { type: 'nuqat', color: '#E3C06A', opacity: 0.9, scale: 8, colorful: true }, shadow: SHADOW(0.5, 3, 6), harakat: true, format: 'landscape' });
  M('versets', 'bandeau', 'Bandeau émeraude et or', '« Quiconque place sa confiance en Dieu, Il lui suffit » : or sur émeraude, cartouche doré sur nuit.', 'وَمَن يَتَوَكَّلْ عَلَى اللَّهِ فَهُوَ حَسْبُهُ',
    { font: 'layla-thuluth', fill: LIN(GOLD2), bg: SOL('#0E1A3A'), frame: { type: 'cartouche', width: 1.8, double: true, pad: 16, ink: false, color: '#D4A537', panelOn: true, panel: '#0B4F3C' }, pattern: { type: 'nuqat', color: '#D4A537', opacity: 0.35, scale: 7 }, harakat: true, format: 'banner' });
  M('versets', 'adam', 'Fond d’écriture', '« Nous avons honoré les fils d’Adam » sur un fond où le mot آدم se répète, à l’encre sépia.', 'وَلَقَدْ كَرَّمْنَا\nبَنِي آدَمَ',
    { font: 'layla-thuluth', fill: SOL('#2B1D12'), bg: LIN(['#F4E7CC', '#E7D0A3']), pattern: { type: 'words', text: 'آدم', color: '#9C6B2E', opacity: 0.3, scale: 9 }, harakat: true, format: 'portrait' });
  // Versets et invocations
  M('versets', 'basmala-arc', 'Basmala en arc', 'La basmala en arc doré sur noir, pour l’entrée d’une maison ou un frontispice.', 'بسم الله الرحمن الرحيم',
    { font: 'layla-thuluth', shape: { type: 'arc', bend: 80 }, fx: { weight: 0.6 }, fill: LIN(GOLD2), bg: SOL('#0A0A0A'), shadow: SHADOW(0.5, 3, 6), format: 'landscape' });
  M('versets', 'hasbuna', 'Hasbunallah', '« Dieu nous suffit », légèrement cintré dans un ovale à double filet, blanc sur nuit.', 'حَسْبُنَا اللَّهُ وَنِعْمَ الْوَكِيلُ',
    { font: 'aref-ruqaa-bold', shape: { type: 'bridge', height: 20 }, fill: SOL('#F4F1EA'), bg: RAD(['#1B2A5C', '#070B1A']), frame: { type: 'oval', width: 1.4, double: true, pad: 12 }, harakat: true, format: 'landscape' });
  M('versets', 'yusra', 'Après la difficulté', '« Avec la difficulté vient la facilité », en nastaʿlīq, voyelles rouges, cartouche.', 'إِنَّ مَعَ الْعُسْرِ يُسْرًا',
    { font: 'noto-nastaliq', fill: SOL('#1B1712'), bg: LIN(PARCH), fx: { marks: { on: true, color: '#b3261e' } }, frame: { type: 'cartouche', width: 1.2, pad: 16 }, harakat: true, format: 'landscape' });
  M('versets', 'nour', 'Verset de la lumière', '« Dieu est la lumière des cieux et de la terre » : or rayonnant sur nuit.', 'اللَّهُ نُورُ السَّمَاوَاتِ وَالْأَرْضِ',
    { font: 'amiri-bold', fill: RAD(['#FFFFFF', '#F3D688', '#9A7420']), bg: RAD(['#1B2A5C', '#05070F']), fx: { glow: { on: true, color: '#f3d688', size: 10, strength: 0.6 } }, harakat: true, format: 'landscape' });
  M('versets', 'dhikr', 'Dhikr en spirale', 'Une invocation qui s’enroule vers le centre, comme une méditation.', 'سبحان الله والحمد لله ولا إله إلا الله والله أكبر',
    { font: 'aref-ruqaa-bold', shape: { type: 'spiral', gap: 120 }, fill: LIN(['#0F5E4A', '#1BA3A3']), bg: SOL('#FFFFFF'), format: 'square' });
  M('versets', 'ikhlas', 'Sourate de l’unicité', '« Dis : Il est Dieu, Unique », en kufi géométrique encadré.', 'قُلْ هُوَ اللَّهُ أَحَدٌ',
    { font: 'layla-koufi', fill: SOL('#1B1712'), bg: SOL('#F2E6C9'), frame: { type: 'rect', width: 2.5, double: true, pad: 14 }, harakat: true, format: 'landscape' });
  // Prénoms
  M('prenoms', 'prenom-coeur', 'Prénom en cœur', 'Un prénom au creux d’un cœur, rose poudré : pour une naissance ou une chambre d’enfant.', 'مريم',
    { font: 'aref-ruqaa-bold', fill: LIN(['#E9A0B4', '#B5495B']), bg: SOL('#FDF0F2'), frame: { type: 'heart', width: 2, pad: 22 }, format: 'square' });
  M('prenoms', 'prenom-or', 'Prénom en relief doré', 'Lettres dorées en relief sur fond nuit.', 'آدم',
    { font: 'layla-thuluth', fill: LIN(GOLD2), bg: LIN(['#1B2A5C', '#070B1A']), fx: { weight: 1, extrude: { on: true, angle: 45, depth: 6, color: '#6b4f1d', shade: true } }, shadow: SHADOW(0.45, 6, 10), format: 'square' });
  M('prenoms', 'prenom-neon', 'Prénom néon', 'Le prénom écrit à la main en tube néon rose.', 'يوسف',
    { font: 'marhey-bold', fill: SOL('#F2FFFC'), bg: RAD(['#1D1B3A', '#06050D']), fx: { glow: { on: true, color: '#f15bb5', size: 16, strength: 0.9 } }, format: 'landscape' });
  M('prenoms', 'prenom-miroir', 'Monogramme en miroir', 'Le prénom et son reflet, en kufi : un monogramme symétrique dans un cercle.', 'علي',
    { font: 'reem-kufi-bold', shape: { repeat: 'mirror', mgap: 4 }, fill: SOL('#111111'), bg: SOL('#FFFFFF'), frame: { type: 'circle', width: 2, pad: 18 }, format: 'square' });
  M('prenoms', 'prenom-sticker', 'Prénom autocollant', 'Lettres rondes à liseré blanc et ombre douce, comme un sticker.', 'سارة',
    { font: 'lalezar', fill: SOL('#E53935'), bg: NONE, fx: { outline: { on: true, color: '#ffffff', gap: 0, width: 7 } }, shadow: SHADOW(0.3, 3, 8) });
  M('prenoms', 'prenom-pastel', 'Prénom pastel', 'Tons d’aquarelle et filet fin, pour un faire-part ou un cadre de chambre.', 'ليلى',
    { font: 'aref-ruqaa', fill: SOL('#5B6B8C'), bg: RAD(['#FDF6EC', '#F3D7CA']), frame: { type: 'round', width: 1, double: true, pad: 24 }, format: 'portrait' });
  M('prenoms', 'prenom-arc', 'Prénom en arc', 'Le prénom courbé en arc, en couleurs vives.', 'إلياس',
    { font: 'baloo-extrabold', shape: { type: 'arc', bend: 80 }, fill: LIN(['#FB8C00', '#E53935', '#8E24AA'], 0), bg: SOL('#FFF8E7'), format: 'landscape' });
  // Fêtes et vœux
  M('fetes', 'aid', 'Aïd Moubarak', 'Or sur bleu nuit, étoiles discrètes : la carte de vœux de l’Aïd.', 'عيد مبارك',
    { font: 'aref-ruqaa-bold', fill: LIN(GOLD2), bg: LIN(['#1B2A5C', '#070B1A']), pattern: { type: 'stars8', color: '#e3c06a', opacity: 0.12, scale: 9 }, shadow: SHADOW(0.45, 4, 6), format: 'square' });
  M('fetes', 'ramadan', 'Ramadan Karim', 'Sous un arc de lanterne, la formule du mois de Ramadan.', 'رمضان\nكريم',
    { font: 'katibeh', fill: LIN(GOLD), bg: RAD(['#22356F', '#0A1028']), frame: { type: 'arch', width: 1.6, pad: 16 }, lineHeight: 1.05, pattern: { type: 'stars6', color: '#e3c06a', opacity: 0.1, scale: 8 }, format: 'portrait' });
  M('fetes', 'adha', 'Aïd al-Adha', 'Émeraude et turquoise dans un cadre festonné.', 'عيد أضحى مبارك',
    { font: 'aref-ruqaa', fill: LIN(['#13563F', '#1BA3A3']), bg: SOL('#FFF8E7'), frame: { type: 'scallop', width: 1.5, pad: 16 }, format: 'square' });
  M('fetes', 'mabrouk', 'Mabrouk !', 'Félicitations en arc-en-ciel, écriture manuscrite joyeuse.', 'ألف مبروك',
    { font: 'marhey-bold', shape: { type: 'arc', bend: 60 }, fill: LIN(['#E53935', '#FB8C00', '#FDD835', '#43A047', '#1E88E5', '#8E24AA'], 0), bg: SOL('#FFFFFF'), format: 'landscape' });
  M('fetes', 'anniversaire', 'Joyeux anniversaire', 'Lettres rondes bombées et confettis.', 'عيد ميلاد سعيد',
    { font: 'lemonada-bold', shape: { type: 'bulge', intensity: 40 }, fill: LIN(['#F15BB5', '#9B5DE5']), bg: SOL('#FFF7FB'), pattern: { type: 'dots', color: '#f15bb5', opacity: 0.25, scale: 7 }, format: 'landscape' });
  M('fetes', 'nouvel-an', 'Bonne année', 'Néon doré sur nuit, porté par une vague.', 'سنة سعيدة',
    { font: 'el-messiri-bold', shape: { type: 'wave', amp: 25, waves: 1 }, fill: SOL('#FFF4D6'), bg: RAD(['#1D1B3A', '#06050D']), fx: { glow: { on: true, color: '#f3d688', size: 12, strength: 0.8 } }, format: 'landscape' });
  M('fetes', 'hajj', 'Hajj mabrour', 'Or sur noir et double filet, dans l’esprit de la kiswa.', 'حج مبرور',
    { font: 'layla-thuluth', fill: LIN(GOLD2), bg: SOL('#0A0A0A'), frame: { type: 'rect', width: 1.4, double: true, pad: 20 }, format: 'landscape' });
  M('fetes', 'kul-am', 'Vœu de toutes les fêtes', '« Bonne année à vous », la formule de toutes les fêtes, en couronne.', 'كل عام وأنتم بخير',
    { font: 'aref-ruqaa-bold', shape: { type: 'circle', cover: 85, ring: 'single' }, fill: LIN(GOLD), bg: SOL('#0E1A3A'), format: 'square' });
  // Mariage et famille
  M('mariage', 'mariage', 'Mariage béni', 'Le vœu traditionnel aux mariés, en diwani doré sur ivoire.', 'بارك الله لكما\nوبارك عليكما',
    { font: 'layla-diwani', fx: { weight: 1.2 }, fill: LIN(GOLD2), bg: RAD(['#FFFBF2', '#F1E4C8']), frame: { type: 'round', width: 1, double: true, pad: 24 }, format: 'landscape' });
  M('mariage', 'maries', 'Les deux prénoms', 'Les prénoms des mariés au creux d’un cœur.', 'أحمد ومريم',
    { font: 'aref-ruqaa-bold', fill: LIN(['#C98A7A', '#8E5244']), bg: SOL('#FFF8F4'), frame: { type: 'heart', width: 1.6, pad: 22 }, format: 'square' });
  M('mariage', 'maison', 'Bénédiction de la maison', 'Pour l’entrée : une bénédiction sous un arc de porte.', 'اللهم بارك\nفي هذا البيت',
    { font: 'amiri-bold', fill: SOL('#5B3A1E'), bg: SOL('#F3E7CE'), frame: { type: 'arch', width: 1.6, pad: 16 }, format: 'portrait' });
  M('mariage', 'parents', 'Pour nos parents', '« Seigneur, fais-leur miséricorde comme ils m’ont élevé tout petit ».', 'وَقُل رَّبِّ ارْحَمْهُمَا\nكَمَا رَبَّيَانِي صَغِيرًا',
    { font: 'aref-ruqaa', shape: { type: 'bridge', height: 25 }, fill: SOL('#1B1712'), bg: LIN(['#FCE7D2', '#E7B49B']), harakat: true, format: 'landscape' });
  M('mariage', 'famille', 'Famille', 'Un mot, une couleur chaude, un arc doux dans un cercle.', 'العائلة',
    { font: 'el-messiri-bold', shape: { type: 'arc', bend: 70 }, fill: SOL('#B8733A'), bg: SOL('#FBF4E2'), frame: { type: 'circle', width: 1.4, pad: 20 }, format: 'square' });
  M('mariage', 'amour', 'Rosace de l’amour', '« Amour » répété en rosace, rouge sur rose.', 'حب',
    { font: 'kufam-black', shape: { repeat: 'rosette', copies: 8, spread: 90 }, fill: LIN(['#E53935', '#7B1E2B']), bg: SOL('#FDF0F2'), format: 'square' });
  // Géométrique
  M('geometrique', 'zellige', 'Zellige', 'Bleu de Fès sur fond crème semé d’étoiles, octogone blanc.', 'أهلاً وسهلاً',
    { font: 'aref-ruqaa-bold', fill: SOL('#0F4C81'), bg: SOL('#F6F1E7'), pattern: { type: 'stars8', color: '#1b7f79', opacity: 0.16, scale: 9 }, frame: { type: 'octagon', width: 1.6, pad: 16, ink: false, color: '#1b7f79', panelOn: true, panel: '#ffffff' }, format: 'square' });
  M('geometrique', 'mosaique', 'Mosaïque hexagonale', 'Or sur vert profond, nid d’abeille doré, médaillon hexagonal.', 'بسم الله',
    { font: 'amiri-bold', fill: LIN(GOLD), bg: SOL('#0B3B2E'), pattern: { type: 'hex', color: '#c9a227', opacity: 0.18, scale: 7 }, frame: { type: 'hexagon', width: 1.8, pad: 18, panelOn: true, panel: '#0b3b2e' }, format: 'square' });
  M('geometrique', 'arabesque', 'Arabesque', 'Cercles entrelacés or sur grenat, cadre festonné.', 'الحمد لله',
    { font: 'layla-thuluth', fill: LIN(GOLD2), bg: SOL('#4A1020'), pattern: { type: 'circles', color: '#e3c06a', opacity: 0.12, scale: 10 }, frame: { type: 'scallop', width: 1.4, pad: 20, panelOn: true, panel: '#4a1020' }, format: 'square' });
  M('geometrique', 'chevrons', 'Chevrons', 'Motif moderne en chevrons, lettres blanches sur bleu canard.', 'سلام',
    { font: 'alexandria-black', fill: SOL('#FFFFFF'), bg: SOL('#1F6F78'), pattern: { type: 'chevrons', color: '#ffffff', opacity: 0.12, scale: 8 }, format: 'landscape' });
  M('geometrique', 'losanges', 'Losanges', 'Kufi rouge sur trame de losanges, esprit tapis.', 'بركة',
    { font: 'kufam-black', fill: SOL('#9E2A2B'), bg: SOL('#F2E6C9'), pattern: { type: 'diamonds', color: '#9e2a2b', opacity: 0.12, scale: 8 }, frame: { type: 'diamond', width: 2, pad: 18, panelOn: true, panel: '#f2e6c9' }, format: 'square' });
  // Moderne
  M('moderne', 'graffiti', 'Calligraffiti', 'Lettres massives bombées sur un dégradé crépuscule, ombre douce.', 'حرية',
    { font: 'jomhuria', shape: { type: 'bulge', intensity: 35 }, fill: SOL('#FFFFFF'), bg: LIN(['#2E1A47', '#8E3B5E', '#E07A5F', '#F2B66D']), shadow: SHADOW(0.45, 5, 10), format: 'landscape' });
  M('moderne', 'relief3d', 'Relief 3D', 'Lettres d’affiche en volume, or et ombre portée.', 'قوة',
    { font: 'lalezar', fill: LIN(GOLD2), bg: LIN(['#1B2A5C', '#070B1A']), fx: { extrude: { on: true, angle: 45, depth: 10, color: '#5b3a1e', shade: true } }, shadow: SHADOW(0.5, 8, 12), format: 'landscape' });
  M('moderne', 'minimal', 'Minimal', 'Une seule ligne fine, noir sur blanc, beaucoup d’espace.', 'سكينة',
    { font: 'beiruti-extralight', fill: SOL('#111111'), bg: SOL('#FFFFFF'), format: 'square' });
  M('moderne', 'pixel', 'Pixel', 'Lettres pixel vertes et lumineuses sur écran noir.', 'أهلاً',
    { font: 'sorena-pixel', fill: SOL('#00E676'), bg: SOL('#050805'), fx: { glow: { on: true, color: '#00e676', size: 8, strength: 0.5 } }, pattern: { type: 'dots', color: '#00e676', opacity: 0.1, scale: 4 }, format: 'landscape' });
  M('moderne', 'machine', 'Machine à écrire', 'Le naskh d’une vieille machine à écrire, sur papier.', 'رسالة إلى صديق',
    { font: 'amiri-typewriter', fill: SOL('#2B2B2B'), bg: SOL('#F4EFE4'), format: 'landscape' });
  M('moderne', 'vague', 'Vague océane', 'La phrase portée par une vague, en dégradé océan.', 'البحر الأزرق',
    { font: 'el-messiri-bold', shape: { type: 'wave', amp: 40, waves: 1.5 }, fill: LIN(['#90E0EF', '#0096C7', '#023E8A']), bg: SOL('#FFFFFF'), format: 'landscape' });
  M('moderne', 'couleur', 'Lettres en couleur', 'Une police dont les points et les signes sont colorés.', 'الخط العربي',
    { font: 'cairo-play-black', fill: SOL('#1B1712'), bg: SOL('#FFFFFF'), format: 'landscape' });
  M('moderne', 'loupe', 'Effet loupe', 'Le centre de la phrase grossi comme sous une loupe.', 'انظر إلى الجمال',
    { font: 'rubik-black', shape: { type: 'fisheye', intensity: 60 }, fill: LIN(['#9B5DE5', '#4A1F45']), bg: SOL('#F3ECFA'), format: 'landscape' });
  M('moderne', 'etire', 'Kashida étirée', 'Des liaisons très longues, à la persane.', 'بسم الله',
    { font: 'mikhak-kashida', fill: SOL('#1B1712'), bg: SOL('#FFFFFF'), format: 'banner' });
  // Découpe et gravure
  M('decoupe', 'laser-rond', 'Découpe laser ronde', 'Texte en cercle et double bordure, lettres épaissies : contours prêts pour le laser ou le vinyle (SVG découpe, DXF).', 'بسم الله الرحمن الرحيم الحمد لله رب العالمين',
    { font: 'aref-ruqaa-bold', shape: { type: 'circle', cover: 100, ring: 'double', ringW: 8 }, fx: { weight: 1.5 }, fill: SOL('#000000'), bg: NONE });
  M('decoupe', 'enseigne', 'Enseigne', 'Kufi noir, double cadre rectangulaire : pour une enseigne découpée.', 'مطعم الأندلس',
    { font: 'reem-kufi-bold', fill: SOL('#111111'), bg: NONE, fx: { weight: 1 }, frame: { type: 'rect', width: 3, double: true, pad: 14 }, format: 'banner' });
  M('decoupe', 'tampon', 'Tampon', 'Encre rouge et cadre arrondi double : pour un tampon ou un ex-libris.', 'مكتبة',
    { font: 'aref-ruqaa-bold', fill: SOL('#B3261E'), bg: NONE, fx: { weight: 1 }, frame: { type: 'round', width: 3, double: true, pad: 12 } });
  M('decoupe', 'bois', 'Gravure sur bois', 'Brun sur bois clair, cartouche : pour une plaque gravée.', 'بيتي جنتي',
    { font: 'kufam-black', fill: SOL('#5B3A1E'), bg: LIN(['#E9D3AE', '#D6B98A']), frame: { type: 'cartouche', width: 2, pad: 14 }, format: 'banner' });
  M('decoupe', 'plaque', 'Plaque de porte', 'Lettres dorées sur ardoise, cadre arrondi.', 'أهلاً وسهلاً',
    { font: 'el-messiri-bold', fill: LIN(GOLD), bg: SOL('#2F3437'), frame: { type: 'round', width: 1.6, pad: 14 }, format: 'banner' });
  M('decoupe', 'pochoir', 'Pochoir', 'Lettres creuses noires, à découper ou à peindre.', 'سلام',
    { font: 'lalezar', fill: SOL('#111111'), bg: NONE, fx: { hollow: { on: true, width: 3 } } });
