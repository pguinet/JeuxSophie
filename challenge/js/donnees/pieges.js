// QCM « pièges » : mots qui se ressemblent (homophones), faux amis avec le français,
// et verbes ou mots que l'on confond. Le `theme` est la paire (ou le groupe) piégée.
// `_` marque le trou ; les questions de faux amis peuvent être posées en français (sans `_`).
// Une seule réponse possible ; les leurres sont de vraies confusions ; anglais britannique.
// niveau 1 = piège courant, 2 = piège classique, 3 = piège fin.
export const PIEGES = [
    // ── homophones et mots proches ──
    // their / there / they're
    { theme: "their/there/they're", question: "Look! _ is a rabbit in the garden.", bonne: 'There', leurres: ['Their', "They're", 'Theirs'], niveau: 1 },
    { theme: "their/there/they're", question: "_ going to the zoo tomorrow.", bonne: "They're", leurres: ['Their', 'There', 'Theirs'], niveau: 2 },
    { theme: "their/there/they're", question: 'The children left _ coats in the hall.', bonne: 'their', leurres: ['there', "they're", 'them'], niveau: 2 },
    { theme: "their/there/they're", question: "My friends say _ coming at six.", bonne: "they're", leurres: ['their', 'there', 'them'], niveau: 3 },
    { theme: "their/there/they're", question: 'Put your bag over _, please.', bonne: 'there', leurres: ['their', "they're", 'they'], niveau: 2 },
    // to / too / two
    { theme: 'to/too/two', question: 'I have _ sisters.', bonne: 'two', leurres: ['to', 'too', 'tow'], niveau: 1 },
    { theme: 'to/too/two', question: 'It is _ cold today. Let us stay inside.', bonne: 'too', leurres: ['to', 'two', 'so to'], niveau: 1 },
    { theme: 'to/too/two', question: 'We are going _ the beach.', bonne: 'to', leurres: ['too', 'two', 'tu'], niveau: 1 },
    { theme: 'to/too/two', question: 'Can I come _? (moi aussi)', bonne: 'too', leurres: ['to', 'two', 'toe'], niveau: 2 },
    { theme: 'to/too/two', question: 'This bag is _ heavy for me to carry.', bonne: 'too', leurres: ['to', 'two', 'enough'], niveau: 3 },
    // your / you're
    { theme: "your/you're", question: "_ my best friend.", bonne: "You're", leurres: ['Your', 'Youre', 'You'], niveau: 2 },
    { theme: "your/you're", question: 'Is this _ pencil case?', bonne: 'your', leurres: ["you're", 'you', 'yours'], niveau: 1 },
    { theme: "your/you're", question: "I think _ right.", bonne: "you're", leurres: ['your', 'you', 'yours'], niveau: 3 },
    { theme: "your/you're", question: 'What is _ favourite colour?', bonne: 'your', leurres: ["you're", 'you', 'yours'], niveau: 2 },
    // its / it's
    { theme: "its/it's", question: "_ a lovely day.", bonne: "It's", leurres: ['Its', 'Is', "Its'"], niveau: 2 },
    { theme: "its/it's", question: 'The cat is washing _ face.', bonne: 'its', leurres: ["it's", 'it', 'their'], niveau: 3 },
    { theme: "its/it's", question: "I like this song. _ my favourite.", bonne: "It's", leurres: ['Its', 'It', 'Is'], niveau: 2 },
    { theme: "its/it's", question: 'The school has _ own library.', bonne: 'its', leurres: ["it's", 'it', 'itself'], niveau: 3 },
    { theme: "its/it's", question: "Look at the bird! _ wings are blue.", bonne: 'Its', leurres: ["It's", 'It', 'Is'], niveau: 3 },
    // were / where / wear
    { theme: 'were/where/wear', question: 'We _ in Paris last week.', bonne: 'were', leurres: ['where', 'wear', 'was'], niveau: 2 },
    { theme: 'were/where/wear', question: '_ do you live?', bonne: 'Where', leurres: ['Were', 'Wear', 'Wheres'], niveau: 1 },
    { theme: 'were/where/wear', question: 'I _ a uniform at school.', bonne: 'wear', leurres: ['where', 'were', 'ware'], niveau: 2 },
    { theme: 'were/where/wear', question: 'Do you know _ my keys are?', bonne: 'where', leurres: ['were', 'wear', 'there'], niveau: 3 },
    { theme: 'were/where/wear', question: 'You can _ my jacket if you are cold.', bonne: 'wear', leurres: ['where', 'were', 'wore'], niveau: 3 },
    // here / hear
    { theme: 'here/hear', question: 'Come _, please.', bonne: 'here', leurres: ['hear', 'hair', 'hare'], niveau: 1 },
    { theme: 'here/hear', question: "I can't _ you. Speak louder!", bonne: 'hear', leurres: ['here', 'hair', 'heir'], niveau: 2 },
    { theme: 'here/hear', question: 'Do you _ that noise? It comes from the kitchen.', bonne: 'hear', leurres: ['here', 'hair', 'ear'], niveau: 2 },
    // see / sea
    { theme: 'see/sea', question: 'We swim in the _.', bonne: 'sea', leurres: ['see', 'sees', 'she'], niveau: 1 },
    { theme: 'see/sea', question: 'I can _ a bird in the tree.', bonne: 'see', leurres: ['sea', 'saw', 'seen'], niveau: 1 },
    { theme: 'see/sea', question: 'Look at the _! It is so blue.', bonne: 'sea', leurres: ['see', 'seen', 'sit'], niveau: 2 },
    // write / right
    { theme: 'write/right', question: 'Turn _ at the bank.', bonne: 'right', leurres: ['write', 'wright', 'rite'], niveau: 1 },
    { theme: 'write/right', question: 'Please _ your name here.', bonne: 'write', leurres: ['right', 'rite', 'wrote'], niveau: 1 },
    { theme: 'write/right', question: 'You are _! The answer is four.', bonne: 'right', leurres: ['write', 'wrote', 'rite'], niveau: 2 },
    { theme: 'write/right', question: 'He is left-handed. He writes with his left hand, not his _ hand.', bonne: 'right', leurres: ['write', 'wright', 'rite'], niveau: 2 },
    // buy / by / bye
    { theme: 'buy/by/bye', question: 'I want to _ a new book.', bonne: 'buy', leurres: ['by', 'bye', 'bay'], niveau: 1 },
    { theme: 'buy/by/bye', question: 'I go to school _ bike.', bonne: 'by', leurres: ['buy', 'bye', 'bi'], niveau: 1 },
    { theme: 'buy/by/bye', question: 'Goodbye! _! See you tomorrow.', bonne: 'Bye', leurres: ['Buy', 'By', 'Bi'], niveau: 1 },
    { theme: 'buy/by/bye', question: 'The cinema is _ the park. (à côté de)', bonne: 'by', leurres: ['buy', 'bye', 'bi'], niveau: 3 },
    // no / know
    { theme: 'no/know', question: 'I _ the answer!', bonne: 'know', leurres: ['no', 'now', 'knows'], niveau: 1 },
    { theme: 'no/know', question: '_, thank you. I am full.', bonne: 'No', leurres: ['Know', 'Now', 'Knew'], niveau: 1 },
    { theme: 'no/know', question: 'There is _ milk in the fridge. It is empty.', bonne: 'no', leurres: ['know', 'now', 'not'], niveau: 2 },
    // new / knew
    { theme: 'new/knew', question: 'I have a _ bike.', bonne: 'new', leurres: ['knew', 'know', 'now'], niveau: 1 },
    { theme: 'new/knew', question: 'I _ the answer yesterday.', bonne: 'knew', leurres: ['new', 'know', 'now'], niveau: 2 },
    // one / won
    { theme: 'one/won', question: 'Our team _ the match yesterday.', bonne: 'won', leurres: ['one', 'win', 'want'], niveau: 2 },
    { theme: 'one/won', question: 'I have _ brother.', bonne: 'one', leurres: ['won', 'wan', 'a one'], niveau: 1 },
    // hour / our
    { theme: 'hour/our', question: 'We have English for one _.', bonne: 'hour', leurres: ['our', 'ours', 'hours'], niveau: 2 },
    { theme: 'hour/our', question: 'This is _ house.', bonne: 'our', leurres: ['hour', 'are', 'ours'], niveau: 2 },
    { theme: 'hour/our', question: 'Let us meet in half an _.', bonne: 'hour', leurres: ['our', 'are', 'hours'], niveau: 3 },
    // meat / meet
    { theme: 'meat/meet', question: 'Nice to _ you!', bonne: 'meet', leurres: ['meat', 'mate', 'meal'], niveau: 1 },
    { theme: 'meat/meet', question: 'Vegetarians do not eat _.', bonne: 'meat', leurres: ['meet', 'mate', 'meal'], niveau: 1 },
    { theme: 'meat/meet', question: 'I will _ you at the station.', bonne: 'meet', leurres: ['meat', 'met', 'mean'], niveau: 2 },
    // sun / son
    { theme: 'sun/son', question: 'The _ is hot today.', bonne: 'sun', leurres: ['son', 'sin', 'sum'], niveau: 1 },
    { theme: 'sun/son', question: 'Mr Smith has a _ and a daughter.', bonne: 'son', leurres: ['sun', 'sum', 'soon'], niveau: 2 },
    // week / weak
    { theme: 'week/weak', question: 'There are seven days in a _.', bonne: 'week', leurres: ['weak', 'wick', 'weeks'], niveau: 1 },
    { theme: 'week/weak', question: 'The old man is very _. He cannot carry the bag.', bonne: 'weak', leurres: ['week', 'wick', 'weal'], niveau: 2 },
    // flour / flower
    { theme: 'flour/flower', question: 'We need _ to make a cake.', bonne: 'flour', leurres: ['flower', 'floor', 'flow'], niveau: 3 },
    { theme: 'flour/flower', question: 'She gave me a beautiful red _.', bonne: 'flower', leurres: ['flour', 'floor', 'flow'], niveau: 2 },
    // witch / which
    { theme: 'witch/which', question: 'The _ has a black hat and a broom.', bonne: 'witch', leurres: ['which', 'watch', 'wish'], niveau: 2 },
    { theme: 'witch/which', question: 'Do you know _ bus goes to the station?', bonne: 'which', leurres: ['witch', 'watch', 'wish'], niveau: 3 },
    // then / than
    { theme: 'then/than', question: 'My sister is taller _ me.', bonne: 'than', leurres: ['then', 'that', 'as'], niveau: 2 },
    { theme: 'then/than', question: 'First we eat, _ we play.', bonne: 'then', leurres: ['than', 'that', 'so'], niveau: 2 },
    { theme: 'then/than', question: 'I like football more _ tennis.', bonne: 'than', leurres: ['then', 'that', 'as'], niveau: 3 },
    // quiet / quite
    { theme: 'quiet/quite', question: 'Be _, please. The baby is sleeping.', bonne: 'quiet', leurres: ['quite', 'quit', 'quiat'], niveau: 2 },
    { theme: 'quiet/quite', question: 'The film was _ good. (assez)', bonne: 'quite', leurres: ['quiet', 'quit', 'quote'], niveau: 3 },
    // weather / whether
    { theme: 'weather/whether', question: 'The _ is sunny today.', bonne: 'weather', leurres: ['whether', 'wether', 'wheather'], niveau: 2 },
    { theme: 'weather/whether', question: "I don't know _ he is coming. (si)", bonne: 'whether', leurres: ['weather', 'wether', 'wheather'], niveau: 3 },
    // through / threw
    { theme: 'through/threw', question: 'He _ the ball to me.', bonne: 'threw', leurres: ['through', 'throw', 'thrown'], niveau: 3 },
    { theme: 'through/threw', question: 'We walked _ the forest.', bonne: 'through', leurres: ['threw', 'thought', 'though'], niveau: 3 },
    // lose / loose
    { theme: 'lose/loose', question: "Don't _ your keys!", bonne: 'lose', leurres: ['loose', 'loss', 'lost'], niveau: 3 },
    { theme: 'lose/loose', question: 'My tooth is _. It is going to fall out.', bonne: 'loose', leurres: ['lose', 'loss', 'luce'], niveau: 3 },
    // break / brake
    { theme: 'break/brake', question: "Don't _ the glass!", bonne: 'break', leurres: ['brake', 'breake', 'brek'], niveau: 2 },
    { theme: 'break/brake', question: 'The bike has a good _. It stops quickly.', bonne: 'brake', leurres: ['break', 'brakes', 'breck'], niveau: 3 },
    // piece / peace
    { theme: 'piece/peace', question: 'Can I have a _ of cake?', bonne: 'piece', leurres: ['peace', 'pece', 'peice'], niveau: 2 },
    { theme: 'piece/peace', question: 'After the war, there was _ in the country.', bonne: 'peace', leurres: ['piece', 'peas', 'peice'], niveau: 3 },
    // whole / hole
    { theme: 'whole/hole', question: 'I ate the _ cake!', bonne: 'whole', leurres: ['hole', 'hall', 'whale'], niveau: 3 },
    { theme: 'whole/hole', question: 'The mouse lives in a small _ in the wall.', bonne: 'hole', leurres: ['whole', 'hall', 'hold'], niveau: 3 },

    // ── faux amis (français / anglais) ──
    // library ≠ librairie
    { theme: 'library ≠ librairie', question: 'Comment dit-on « bibliothèque » en anglais ?', bonne: 'library', leurres: ['bookshop', 'librarie', 'bookstore'], niveau: 2 },
    { theme: 'library ≠ librairie', question: 'Comment dit-on « librairie » (le magasin) en anglais britannique ?', bonne: 'bookshop', leurres: ['library', 'librairy', 'booklibrary'], niveau: 3 },
    { theme: 'library ≠ librairie', question: 'I buy my books at the _ in town.', bonne: 'bookshop', leurres: ['library', 'bookcase', 'bookbag'], niveau: 3 },
    // actually ≠ actuellement
    { theme: 'actually ≠ actuellement', question: 'Comment dit-on « actuellement » en anglais ?', bonne: 'at the moment', leurres: ['actually', 'in fact', 'really'], niveau: 3 },
    { theme: 'actually ≠ actuellement', question: 'Que veut dire « actually » dans : « Actually, I don\'t like pizza » ?', bonne: 'en fait', leurres: ['actuellement', 'aujourd\'hui', 'jamais'], niveau: 3 },
    { theme: 'actually ≠ actuellement', question: 'I thought he was ten, but _ he is twelve.', bonne: 'actually', leurres: ['at the moment', 'usually', 'finally'], niveau: 3 },
    // sensible ≠ sensible
    { theme: 'sensible ≠ sensible', question: 'Comment dit-on « sensible » (qui a facilement de la peine) en anglais ?', bonne: 'sensitive', leurres: ['sensible', 'sensibel', 'sensitiv'], niveau: 3 },
    { theme: 'sensible ≠ sensible', question: 'My brother is very _. He never does silly things. (raisonnable)', bonne: 'sensible', leurres: ['sensitive', 'sensibly', 'sensing'], niveau: 3 },
    // sympathetic ≠ sympathique
    { theme: 'sympathetic ≠ sympathique', question: 'Comment dit-on « sympathique » (agréable) en anglais ?', bonne: 'nice', leurres: ['sympathetic', 'sympathique', 'sympatic'], niveau: 2 },
    { theme: 'sympathetic ≠ sympathique', question: 'Our new teacher is very _. We all like her.', bonne: 'nice', leurres: ['sympathetic', 'sympatic', 'sympathy'], niveau: 3 },
    // newspaper / journal
    { theme: 'journal ≠ journal', question: 'Comment dit-on « journal » (celui qu\'on achète au kiosque) en anglais ?', bonne: 'newspaper', leurres: ['journal', 'journey', 'magazine'], niveau: 3 },
    { theme: 'journal ≠ journal', question: 'Comment dit-on « journal intime » en anglais ?', bonne: 'diary', leurres: ['newspaper', 'dairy', 'daily'], niveau: 3 },
    // attend ≠ attendre
    { theme: 'attend ≠ attendre', question: 'Comment dit-on « attendre » (le bus) en anglais ?', bonne: 'wait for', leurres: ['attend', 'expect', 'wait to'], niveau: 3 },
    { theme: 'attend ≠ attendre', question: 'I _ English lessons on Mondays. (je suis les cours)', bonne: 'attend', leurres: ['wait', 'assist', 'listen'], niveau: 3 },
    // assist ≠ assister
    { theme: 'assist ≠ assister', question: 'Comment dit-on « assister à un concert » en anglais ?', bonne: 'attend a concert', leurres: ['assist a concert', 'assist to a concert', 'look a concert'], niveau: 3 },
    { theme: 'assist ≠ assister', question: 'Que veut dire « to assist » ?', bonne: 'aider', leurres: ['assister à', 'asseoir', 'attendre'], niveau: 3 },
    // grand ≠ grand
    { theme: 'grand ≠ grand', question: 'Comment dit-on « grand » (pour la taille d\'une personne) en anglais ?', bonne: 'tall', leurres: ['grand', 'long', 'high'], niveau: 2 },
    // blessed ≠ blessé
    { theme: 'blessed ≠ blessé', question: 'Tom fell off his bike and he is _. (blessé)', bonne: 'hurt', leurres: ['blessed', 'blessing', 'bless'], niveau: 3 },
    { theme: 'blessed ≠ blessé', question: 'Que veut dire « blessed » ?', bonne: 'béni', leurres: ['blessé', 'bleu', 'bavard'], niveau: 3 },
    // car location ≠ location
    { theme: 'location ≠ location', question: 'Comment dit-on « location de voitures » en anglais britannique ?', bonne: 'car hire', leurres: ['car location', 'car locating', 'car rent'], niveau: 3 },
    { theme: 'location ≠ location', question: 'Que veut dire « location » dans « the location of the school » ?', bonne: 'l\'endroit', leurres: ['la location', 'la leçon', 'la sortie'], niveau: 3 },
    // pain ≠ pain
    { theme: 'pain ≠ pain', question: 'Comment dit-on « pain » (qu\'on mange) en anglais ?', bonne: 'bread', leurres: ['pain', 'butter', 'cake'], niveau: 1 },
    { theme: 'pain ≠ pain', question: 'I have a _ in my back. (une douleur)', bonne: 'pain', leurres: ['bread', 'pen', 'pane'], niveau: 2 },
    // coin ≠ coin
    { theme: 'coin ≠ coin', question: 'Comment dit-on « coin » (de la rue) en anglais ?', bonne: 'corner', leurres: ['coin', 'edge', 'side'], niveau: 2 },
    { theme: 'coin ≠ coin', question: 'I have a _ in my pocket. (une pièce de monnaie)', bonne: 'coin', leurres: ['corner', 'cone', 'corn'], niveau: 2 },
    // rest ≠ rester
    { theme: 'rest ≠ rester', question: 'Comment dit-on « rester à la maison » en anglais ?', bonne: 'stay at home', leurres: ['rest at home', 'stand at home', 'keep at home'], niveau: 3 },
    { theme: 'rest ≠ rester', question: 'Que veut dire « to rest » ?', bonne: 'se reposer', leurres: ['rester', 'courir', 'manger'], niveau: 2 },
    // travail / travel
    { theme: 'travel ≠ travail', question: 'Comment dit-on « travail » en anglais ?', bonne: 'work', leurres: ['travel', 'travail', 'trip'], niveau: 2 },
    { theme: 'travel ≠ travail', question: 'I love to _ by plane. (voyager)', bonne: 'travel', leurres: ['work', 'trip', 'journey'], niveau: 2 },
    // lecture ≠ lecture
    { theme: 'lecture ≠ lecture', question: 'Comment dit-on « lecture » (action de lire) en anglais ?', bonne: 'reading', leurres: ['lecture', 'lesson', 'lector'], niveau: 3 },
    { theme: 'lecture ≠ lecture', question: 'Que veut dire « a lecture » ?', bonne: 'une conférence', leurres: ['une lecture', 'une leçon', 'une lettre'], niveau: 3 },
    // countryside ≠ campagne
    { theme: 'camp ≠ campagne', question: 'Comment dit-on « campagne » (par opposition à la ville) en anglais ?', bonne: 'countryside', leurres: ['camp', 'campaign', 'country house'], niveau: 3 },
    // chips / crisps
    { theme: 'chips ≠ chips', question: 'Comment dit-on « frites » en anglais britannique ?', bonne: 'chips', leurres: ['crisps', 'fries', 'French chips'], niveau: 3 },
    { theme: 'chips ≠ chips', question: 'Comment dit-on « chips » (le paquet croustillant) en anglais britannique ?', bonne: 'crisps', leurres: ['chips', 'fries', 'chipps'], niveau: 3 },
    // ask ≠ demander
    { theme: 'demand ≠ demander', question: 'Comment dit-on « demander » (quelque chose à quelqu\'un) en anglais ?', bonne: 'ask', leurres: ['demand', 'request', 'order'], niveau: 3 },
    // disappoint ≠ décevoir
    { theme: 'deceive ≠ décevoir', question: 'Comment dit-on « décevoir » en anglais ?', bonne: 'disappoint', leurres: ['deceive', 'decide', 'receive'], niveau: 3 },
    // rude ≠ rude
    { theme: 'rude ≠ rude', question: 'Comment dit-on « impoli » en anglais ?', bonne: 'rude', leurres: ['hard', 'rough', 'rud'], niveau: 3 },
    // raisin ≠ raisin
    { theme: 'raisin ≠ raisin', question: 'Comment dit-on « raisin » (le fruit en grappe) en anglais ?', bonne: 'grape', leurres: ['raisin', 'plum', 'berry'], niveau: 2 },
    { theme: 'raisin ≠ raisin', question: 'Que veut dire « raisin » en anglais ?', bonne: 'raisin sec', leurres: ['raisin', 'prune', 'cerise'], niveau: 3 },
    // sale ≠ sale
    { theme: 'sale ≠ sale', question: 'Comment dit-on « sale » (pas propre) en anglais ?', bonne: 'dirty', leurres: ['sale', 'salty', 'sail'], niveau: 1 },
    // shop ≠ magazine
    { theme: 'magazine ≠ magasin', question: 'Comment dit-on « magasin » en anglais ?', bonne: 'shop', leurres: ['magazine', 'market', 'factory'], niveau: 2 },
    { theme: 'magazine ≠ magasin', question: 'Que veut dire « a magazine » ?', bonne: 'un magazine', leurres: ['un magasin', 'un marché', 'un musée'], niveau: 2 },
    // sweet / candy
    { theme: 'bonbon ≠ candy', question: 'Comment dit-on « bonbon » en anglais britannique ?', bonne: 'sweet', leurres: ['candy', 'bonbon', 'sugar'], niveau: 3 },
    // eventually ≠ éventuellement
    { theme: 'eventually ≠ éventuellement', question: 'Que veut dire « eventually » dans : « Eventually, we arrived home » ?', bonne: 'finalement', leurres: ['éventuellement', 'rapidement', 'souvent'], niveau: 3 },
    { theme: 'eventually ≠ éventuellement', question: 'We waited for an hour and _ the bus came. (finalement)', bonne: 'eventually', leurres: ['possibly', 'usually', 'actually'], niveau: 3 },

    // ── mots que l'on confond ──
    // make / do
    { theme: 'make/do', question: 'I always _ my homework before dinner.', bonne: 'do', leurres: ['make', 'does', 'makes'], niveau: 1 },
    { theme: 'make/do', question: 'Mum is going to _ a cake.', bonne: 'make', leurres: ['do', 'does', 'done'], niveau: 1 },
    { theme: 'make/do', question: "Please don't _ a noise.", bonne: 'make', leurres: ['do', 'have', 'take'], niveau: 2 },
    { theme: 'make/do', question: 'Can you _ me a favour?', bonne: 'do', leurres: ['make', 'take', 'give'], niveau: 3 },
    { theme: 'make/do', question: 'I need to _ my bed every morning.', bonne: 'make', leurres: ['do', 'fix', 'put'], niveau: 3 },
    // say / tell / speak
    { theme: 'say/tell/speak', question: 'He _ me a funny story.', bonne: 'told', leurres: ['said', 'spoke', 'talked'], niveau: 2 },
    { theme: 'say/tell/speak', question: '"Hello!" she _.', bonne: 'said', leurres: ['told', 'spoke', 'talked'], niveau: 2 },
    { theme: 'say/tell/speak', question: 'Can you _ me the way to the station?', bonne: 'tell', leurres: ['say', 'speak', 'talk'], niveau: 2 },
    { theme: 'say/tell/speak', question: 'Tom _ that he was tired.', bonne: 'said', leurres: ['told', 'spoke', 'talked'], niveau: 3 },
    { theme: 'say/tell/speak', question: 'My grandpa can _ French and Spanish.', bonne: 'speak', leurres: ['say', 'tell', 'talk'], niveau: 2 },
    // look / watch / see
    { theme: 'look/watch/see', question: '_ at the blackboard, please!', bonne: 'Look', leurres: ['Watch', 'See', 'Listen'], niveau: 1 },
    { theme: 'look/watch/see', question: 'I _ TV every evening.', bonne: 'watch', leurres: ['look', 'see', 'listen'], niveau: 1 },
    { theme: 'look/watch/see', question: 'I can _ the mountain from my window.', bonne: 'see', leurres: ['look', 'watch', 'listen'], niveau: 3 },
    // borrow / lend
    { theme: 'borrow/lend', question: 'Can I _ your pen, please?', bonne: 'borrow', leurres: ['lend', 'lent', 'leave'], niveau: 2 },
    { theme: 'borrow/lend', question: 'Can you _ me your bike for an hour?', bonne: 'lend', leurres: ['borrow', 'borrowed', 'owe'], niveau: 3 },
    // bring / take
    { theme: 'bring/take', question: 'Come to my party and _ your friends!', bonne: 'bring', leurres: ['take', 'carry', 'go'], niveau: 3 },
    { theme: 'bring/take', question: 'It is cold. _ your coat when you go out. (tu sors sans moi)', bonne: 'Take', leurres: ['Bring', 'Carry', 'Come'], niveau: 3 },
    // learn / teach
    { theme: 'learn/teach', question: 'Mrs Brown _ us English.', bonne: 'teaches', leurres: ['learns', 'learn', 'teach'], niveau: 2 },
    { theme: 'learn/teach', question: 'I want to _ to swim.', bonne: 'learn', leurres: ['teach', 'study', 'know'], niveau: 2 },
    { theme: 'learn/teach', question: 'My dad _ me to ride a bike.', bonne: 'taught', leurres: ['learned', 'learnt', 'teached'], niveau: 3 },
    // fun / funny
    { theme: 'fun/funny', question: 'This clown is very _. I cannot stop laughing.', bonne: 'funny', leurres: ['fun', 'funy', 'funnier'], niveau: 2 },
    { theme: 'fun/funny', question: 'Swimming is _! I love it.', bonne: 'fun', leurres: ['funny', 'fan', 'funning'], niveau: 3 },
    // bored / boring, excited / exciting
    { theme: 'bored/boring', question: 'I am _. There is nothing to do.', bonne: 'bored', leurres: ['boring', 'bore', 'boredom'], niveau: 2 },
    { theme: 'bored/boring', question: 'This lesson is so _.', bonne: 'boring', leurres: ['bored', 'bore', 'boredom'], niveau: 2 },
    { theme: 'excited/exciting', question: 'The film was very _.', bonne: 'exciting', leurres: ['excited', 'excite', 'excitement'], niveau: 3 },
    { theme: 'excited/exciting', question: 'I am very _ about the trip.', bonne: 'excited', leurres: ['exciting', 'excite', 'excitement'], niveau: 3 },
    // listen / hear
    { theme: 'listen/hear', question: 'Please _ to the teacher.', bonne: 'listen', leurres: ['hear', 'hearing', 'look'], niveau: 2 },
    { theme: 'listen/hear', question: "I can't _ you. It is too noisy.", bonne: 'hear', leurres: ['listen', 'listen to', 'hearing'], niveau: 2 },
    // job / work
    { theme: 'job/work', question: 'My mum has a new _.', bonne: 'job', leurres: ['work', 'works', 'working'], niveau: 3 },
    { theme: 'job/work', question: 'I have a lot of _ to do today.', bonne: 'work', leurres: ['job', 'jobs', 'works'], niveau: 3 },
    // mots indénombrables
    { theme: 'indénombrables', question: 'I have got a lot of _.', bonne: 'homework', leurres: ['homeworks', 'a homework', 'homeworkes'], niveau: 3 },
    { theme: 'indénombrables', question: 'Can you give me some _ about the trip?', bonne: 'information', leurres: ['informations', 'an information', 'a information'], niveau: 3 },
    { theme: 'indénombrables', question: 'The news _ good today.', bonne: 'is', leurres: ['are', 'be', 'am'], niveau: 3 },
    { theme: 'indénombrables', question: 'My trousers _ too long.', bonne: 'are', leurres: ['is', 'am', 'be'], niveau: 3 },
    // être / avoir
    { theme: 'be ≠ avoir', question: 'My brother _ twelve years old.', bonne: 'is', leurres: ['has', 'have', 'got'], niveau: 1 },
    { theme: 'be ≠ avoir', question: 'I _ hungry. Can I have a sandwich?', bonne: 'am', leurres: ['have', 'has', 'got'], niveau: 1 },
    { theme: 'be ≠ avoir', question: 'We _ cold. Can you close the window?', bonne: 'are', leurres: ['have', 'has', 'got'], niveau: 2 },
    // also / too
    { theme: 'also/too', question: 'I like pizza and I _ like pasta.', bonne: 'also', leurres: ['so', 'as well', 'either'], niveau: 3 },
    // at home
    { theme: 'at home', question: 'I am _ home.', bonne: 'at', leurres: ['in', 'on', 'to'], niveau: 2 },
];
