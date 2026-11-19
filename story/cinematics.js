// Cinematiche: inquadrature con illustrazione (cine/*.jpg, fallback sfondo procedurale),
// camera Ken Burns cam:[[x,y,zoom],[x,y,zoom]], attori animati, sottotitoli narrati.
// Riprodotte in automatico: <cap>_intro all'avvio capitolo, end_<finale> prima dei titoli; {cine:'id'} nelle scene.
(() => {
  const C = G.cine;
  const PAN_R = [[.35, .5, 1.18], [.65, .5, 1.05]], PAN_L = [[.65, .5, 1.18], [.35, .5, 1.05]];
  const PUSH = [[.5, .5, 1.0], [.5, .45, 1.25]], PULL = [[.5, .55, 1.3], [.5, .5, 1.0]];
  const RISE = [[.5, .75, 1.25], [.5, .3, 1.15]], SINK = [[.5, .3, 1.2], [.5, .7, 1.15]];
  const PARTY = (ids, from, to, face = 1, scale = 1) => ({ ids, from, to, face, scale });
  const SHIP = (from, to, scale = 1, face = 1) => ({ k: 'ship', from, to, scale, face, lin: true });
  const FOE = (look, color, at, scale = 1) => ({ k: 'enemy', look, color, from: at, scale });

  // ---------------- PROLOGO ----------------
  C('c1_intro', [
    { bg: 'black', music: 'title', title: 'Cento anni fa', text: '', dur: 3200, cam: [[.5, .5, 1], [.5, .5, 1]] },
    { img: 'aurora', bg: 'dawn', cam: PULL, text: "C'era un cuore di luce sopra il Mare di Nubi. Lo chiamavano Aurora. Ogni mattina faceva sorgere il sole." },
    { img: 'throne', bg: 'hollow_throne', cam: PUSH, sfx: 'thunder', fx: 'shake', text: "Poi qualcosa, dal fondo della notte, aprì la bocca. E l'Aurora fu inghiottita." },
    { img: 'lutece', bg: 'lutece_night', cam: PAN_R, music: 'lutece', text: "Da allora le isole volanti vivono di lampade a etere. A Ovest, Lutèce, la Città delle Lampade, non ha mai visto un'alba." },
    { img: 'lutece', bg: 'lutece_roofs', cam: [[.7, .6, 1.4], [.55, .55, 1.25]], actors: [PARTY(['mira'], [.25, .82], [.5, .82])], text: "Mira Valloire, diciannove anni, accende lampioni e disegna mappe di posti che nessuno ha mai visto." },
    { img: 'libellula', bg: 'lutece_hangar', cam: PUSH, text: "Sua nonna Élise le ha lasciato due cose: un vecchio aeroveliero chiamato Libellula…" },
    { bg: 'skyship_cabin', cam: [[.5, .5, 1.3], [.5, .45, 1.6]], sfx: 'chime', fx: 'flash', text: "…e una bussola d'ottone il cui ago non punta il nord. Punta l'Aurora." },
    { bg: 'black', title: "Rotta d'Aurora", text: 'Una storia di luce, di notte e di chi sceglie la rotta.', dur: 4800, cam: [[.5, .5, 1], [.5, .5, 1]] },
  ]);
  C('c1_decollo', [
    { img: 'libellula', bg: 'lutece_hangar', music: 'storm', cam: PUSH, sfx: 'explosion', fx: 'shake', text: 'I portelloni dell\'hangar si spalancano sul vuoto. Le sirene dell\'Armata urlano sotto i tetti.' },
    { img: 'lutece', bg: 'sky_open', cam: PAN_L, actors: [SHIP([.15, .62], [.85, .38], 1.2)], text: 'La Libellula si stacca da Lutèce. Per la prima volta, Mira guarda la sua città dall\'alto: un pugno di lucciole nel buio.' },
    { bg: 'sky_open', cam: [[.5, .5, 1.05], [.6, .45, 1.15]], actors: [SHIP([.3, .55], [.75, .5], 1.6)], text: 'L\'ago della bussola trema, poi si ferma. A Est. Sempre a Est.' },
  ]);

  // ---------------- CAPITOLI ----------------
  C('c2_intro', [
    { img: 'rust', bg: 'rustworks', music: 'rust', cam: PAN_R, sfx: 'wind', text: 'Due giorni di volo. Poi, dalle nubi, emerge un\'isola fatta di navi morte, saldate l\'una sull\'altra.' },
    { img: 'rust', bg: 'forge', cam: [[.6, .65, 1.3], [.45, .55, 1.1]], fx: 'embers', text: 'Le Officine di Ruggine: dove le aeronavi vanno a morire, e dove qualcuno le fa rinascere. Per un prezzo.' },
    { bg: 'rustworks', cam: [[.5, .6, 1.1], [.5, .55, 1.2]], actors: [SHIP([.1, .45], [.6, .62], 1.1)], text: 'La Libellula tossisce fumo nero. Atterrare sarà facile. Ripartire, molto meno.' },
  ]);
  C('c3_intro', [
    { img: 'garden', bg: 'garden_ruins', music: 'garden', cam: RISE, fx: 'petals', text: 'Oltre le Officine, le nubi si fanno dense come latte. Dentro, qualcosa di enorme dorme.' },
    { img: 'garden', bg: 'giant_hall', cam: [[.4, .5, 1.35], [.6, .45, 1.1]], text: 'Statue alte come torri, con le mani aperte verso un cielo che non ricordano. Una civiltà intera, sommersa dal silenzio.' },
    { bg: 'garden_ruins', cam: PUSH, sfx: 'chime', text: 'E la bussola, per la prima volta, non punta avanti. Punta in basso.' },
  ]);
  C('c4_intro', [
    { img: 'market', bg: 'night_market', music: 'market', cam: PAN_R, text: 'Mille lanterne appese al vuoto. Il Mercato galleggia nella notte come una festa che non finisce mai.' },
    { img: 'market', bg: 'night_market', cam: [[.55, .55, 1.4], [.45, .5, 1.2]], fx: 'embers', text: 'Qui si compra tutto: spezie, segreti, mappe false, nomi nuovi. Qui nessuno chiede da dove vieni.' },
    { bg: 'shadow_theatre', cam: PUSH, music: 'tension', text: 'Ma tra le bancarelle, figure velate cercano qualcuno. Una bambina fatta di nube.' },
  ]);
  C('c5_intro', [
    { img: 'cathedral', bg: 'cathedral', music: 'choir', cam: RISE, text: 'Vetro nero, guglie come aghi. La Cattedrale del Coro Silente non riflette la luce: la beve.' },
    { img: 'cathedral', bg: 'crypt', cam: SINK, sfx: 'bell', text: 'Il Coro canta che nel buio nessuno vede le nostre ferite. Che la notte è una misericordia.' },
    { bg: 'cathedral', cam: [[.5, .5, 1.1], [.5, .4, 1.3]], text: 'Da qualche parte, là dentro, Nuvola sta aspettando che qualcuno venga a prenderla.' },
  ]);
  C('c6_intro', [
    { img: 'storm', bg: 'storm', music: 'storm', cam: PUSH, fx: 'lightning', text: 'Un muro di nubi che ruota su se stesso da cent\'anni. La Tempesta Eterna. Nessuna nave l\'ha mai attraversata due volte.' },
    { bg: 'storm', cam: [[.4, .5, 1.1], [.6, .5, 1.2]], fx: 'rain', actors: [SHIP([.2, .6], [.55, .5], 1.1)], text: 'La Libellula entra nella bufera. Le vele urlano. Il legno geme come un animale.' },
    { img: 'storm', bg: 'flagship', cam: RISE, fx: 'lightning', sfx: 'alarm', text: 'E nel cuore della tempesta, immobile come un\'isola di ferro, aspetta il Leviatano dell\'Ammiraglio Malachar.' },
  ]);
  C('c7_intro', [
    { img: 'silence', bg: 'silence_isles', music: 'silence', cam: PAN_L, text: 'Dopo la tempesta, il nulla. Isole bianche, immobili. Nessun vento. Nessun suono.' },
    { img: 'silence', bg: 'white_forest', cam: [[.5, .6, 1.3], [.5, .5, 1.05]], fx: 'snow', text: 'Le Isole del Silenzio: metà del viaggio, il punto più lontano da ogni luce. Qui le navi non precipitano. Si fermano, e basta.' },
    { bg: 'silence_isles', cam: PUSH, actors: [SHIP([.3, .4], [.6, .62], 1.1)], text: 'E la Libellula, ferita, comincia a scendere.' },
  ]);
  C('c7_bram', [
    { img: 'silence', bg: 'silence_isles', music: 'sad', cam: PULL, actors: [SHIP([.45, .5], [.62, .22], 1, 1)], text: 'La Libellula sale verso il cielo bianco, spinta da un cuore che non è il suo.' },
    { bg: 'white_forest', cam: [[.5, .6, 1.5], [.5, .55, 1.15]], fx: 'snow', actors: [PARTY(['bram'], [.5, .8], [.5, .8], -1, 1.2)], text: 'Sull\'orlo del baratro, una sagoma di pietra si inginocchia. Il volto rivolto a Est.' },
    { bg: 'black', cam: [[.5, .5, 1], [.5, .5, 1]], text: 'Era vivo. Fino all\'ultimo istante.', dur: 4200 },
  ]);
  C('c8_intro', [
    { img: 'akatsuki', bg: 'akatsuki', music: 'akatsuki', cam: PAN_R, fx: 'petals', text: 'Pagode rosse, ciliegi neri, ponti sospesi sopra il vuoto. Akatsuki, la Città dell\'Alba Spenta.' },
    { img: 'akatsuki', bg: 'akatsuki_palace', cam: RISE, text: 'Un tempo era la prima città a vedere il sole. Oggi è la più buia di tutte, e la più bella.' },
    { bg: 'akatsuki', cam: PUSH, if: "has('kai')", actors: [PARTY(['kai'], [.5, .8], [.5, .8], 1, 1.2)], text: 'Kai non dice niente. Ma stringe l\'elsa della spada come chi torna a casa sapendo che la casa non lo vuole.' },
    { bg: 'akatsuki_palace', cam: PUSH, music: 'tension', text: 'In cima al palazzo, lo Shōgun Raiden attende. Ha venduto la luce del suo popolo. E sa che stanno arrivando.' },
  ]);
  C('c9_intro', [
    { img: 'throne', bg: 'hollow_descent', music: 'throne', cam: SINK, text: 'Sotto Akatsuki, la notte ha un fondo. Una scala che scende per mille anni.' },
    { img: 'throne', bg: 'hollow_throne', cam: PUSH, sfx: 'thunder', fx: 'shake', text: 'E in fondo, un trono. Sopra il trono, una corona. Sotto la corona, nessuno. Solo fame.' },
    { bg: 'hollow_throne', cam: [[.5, .5, 1.3], [.5, .5, 1.6]], actors: [FOE('boss_king', '#7a5cff', [.5, .5], 1.3)], text: 'Il Re Vuoto. Ha inghiottito l\'Aurora cento anni fa. Ora sente arrivare l\'ultimo frammento di luce.' },
    { bg: 'black', title: 'Ultimo capitolo', text: 'Ogni scelta vi ha portati qui.', dur: 3800, cam: [[.5, .5, 1], [.5, .5, 1]] },
  ]);

  // ---------------- FINALI ----------------
  C('end_alba_di_tutti', [
    { img: 'dawn', bg: 'dawn', music: 'dawn', cam: RISE, fx: 'flash', text: 'E il sole sorge. Non su un\'isola. Su tutte.' },
    { img: 'aurora', bg: 'dawn', cam: PULL, text: 'A Lutèce, la gente spegne le lampade una a una, e alza gli occhi. Qualcuno piange. Qualcuno ride. Nessuno sa cosa dire.' },
    { bg: 'dawn', cam: PAN_R, actors: [PARTY(['mira', 'kai', 'otto', 'bram', 'nuvola'], [.15, .82], [.55, .82])], text: 'Sulla prua della Libellula, tutti insieme. Nessuno lasciato indietro.' },
    { img: 'dawn', bg: 'dawn', cam: PUSH, text: 'Mira apre il quaderno delle mappe. Per la prima volta, disegna il sole.' },
  ]);
  C('end_prezzo_luce', [
    { img: 'aurora', bg: 'dawn', music: 'sad', cam: PUSH, fx: 'flash', text: 'Nuvola si scioglie in luce, ridendo, come se fosse solo un gioco.' },
    { img: 'dawn', bg: 'dawn', music: 'dawn', cam: RISE, text: 'E l\'alba torna. Bellissima. Calda. Pagata.' },
    { bg: 'dawn', cam: [[.5, .45, 1.1], [.5, .35, 1.3]], fx: 'petals', text: 'Ogni mattina, da allora, c\'è una piccola nube rosa che arriva prima del sole. Mira la saluta sempre.' },
  ]);
  C('end_ronin_cartografa', [
    { img: 'akatsuki', bg: 'akatsuki', music: 'dawn', cam: PAN_R, fx: 'petals', text: 'L\'alba torna solo a metà: un chiarore lungo, sospeso, che non diventa mai giorno pieno.' },
    { bg: 'akatsuki', cam: [[.5, .6, 1.3], [.5, .55, 1.1]], actors: [PARTY(['mira', 'kai'], [.3, .82], [.55, .82])], text: 'Ma ad Akatsuki due persone ricostruiscono una casa con le finestre a Est. Lui pianta ciliegi. Lei disegna la strada per tornarci.' },
    { img: 'dawn', bg: 'dawn', cam: PUSH, text: 'Non è la fine del mondo che sognavano. È l\'inizio di un altro.' },
  ]);
  C('end_corona_ferro', [
    { img: 'storm', bg: 'flagship', music: 'tension', cam: RISE, text: 'L\'Aurora brilla di nuovo. Ma dentro una gabbia d\'acciaio, sulla prua del Leviatano.' },
    { img: 'dawn', bg: 'dawn', cam: PAN_L, text: 'Il sole sorge sulle isole che l\'Armata giudica degne. Sulle altre, la notte continua. Ordinata. Efficiente.' },
    { bg: 'flagship', cam: PUSH, actors: [FOE('boss_admiral', '#c9a24a', [.5, .55], 1.1)], text: 'Malachar ha mantenuto la parola. È proprio questo il problema.' },
  ]);
  C('end_regina_notte', [
    { img: 'throne', bg: 'hollow_throne', music: 'boss', cam: PUSH, fx: 'redflash', text: 'Mira apre le mani, e l\'Aurora non la attraversa. Entra in lei.' },
    { img: 'aurora', bg: 'dreamscape', cam: PULL, text: 'Il sole sorge quando lei decide. Dove lei decide. Per chi lo merita.' },
    { bg: 'hollow_throne', cam: [[.5, .45, 1.1], [.5, .4, 1.4]], actors: [PARTY(['mira'], [.5, .8], [.5, .8], 1, 1.3)], text: 'Il trono non è più vuoto.' },
  ]);
  C('end_tradimento', [
    { img: 'throne', bg: 'hollow_throne', music: 'tension', cam: PUSH, fx: 'flash', text: 'Un istante. Una mano guantata. L\'Aurora sparisce in una borsa di velluto.' },
    { bg: 'sky_open', cam: PAN_R, actors: [SHIP([.2, .55], [.85, .3], .9)], text: 'Sable non si volta. Da qualche parte, lontano, qualcuno pagherà moltissimo per un sole tutto suo.' },
    { img: 'dawn', bg: 'dawn', music: 'sad', cam: SINK, text: 'L\'alba esiste di nuovo. Solo che adesso ha un prezzo, e un proprietario.' },
  ]);
  C('end_notte_eterna', [
    { img: 'throne', bg: 'hollow_throne', music: 'sad', cam: PUSH, text: 'La corona si chiude. L\'ultimo frammento di luce scivola giù, nella gola del buio.' },
    { img: 'lutece', bg: 'lutece_night', cam: PAN_L, text: 'A Lutèce, le lampade continuano ad ardere. Qualcuno ne accende una in più, per chi è partito e non è tornato.' },
    { bg: 'black', cam: [[.5, .5, 1], [.5, .5, 1]], text: 'La notte è lunga. Ma le mappe restano. E qualcuno, un giorno, ripartirà.', dur: 5200 },
  ]);
})();
