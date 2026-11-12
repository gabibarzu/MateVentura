# Kit de promovare — MateVentura cu Cifrel

**Numere mici. Aventuri mari.**

Link: https://gabibarzu.github.io/MateVentura/

## Ce oferă aplicația acum

- **Învățare:** în ritmul copilului, fără cronometru sau scor, cu ajutor progresiv și progres păstrat pe dispozitiv.
- **Joc:** joc rapid, niveluri Ușor / Mediu / Greu și setări personalizate; rezultate și clasament local pentru nivelurile standard.
- **Cifrel:** partenerul curios care a venit să-l ajute pe Matei și îi invită și pe alți copii să descopere matematica.
- Adunări și scăderi, pentru copii de aproximativ 5–8 ani; gratuit, fără cont și fără reclame.
- **Aventură:** prima misiune, „Repară racheta lui Cifrel”, are cinci calcule, piese care se montează și o lansare la final. Progresul reparației se păstrează local. Alte misiuni în Numărilia sunt în pregătire.

## Imagini

| Fișier | Dimensiuni | Utilizare |
| --- | --- | --- |
| post-1080x1080.png | 1080 × 1080 | Facebook / Instagram feed, grupuri |
| story-1080x1920.png | 1080 × 1920 | Story / WhatsApp Status; adaugă un sticker de link unde este disponibil |
| cover-facebook-1640x624.png | 1640 × 624 | Copertă Facebook; verifică decuparea pe dispozitiv |
| profil-1080x1080.png | 1080 × 1080 | Cifrel, cu spațiu pentru decupare circulară |
| app-joc.png, app-corect.png | Capturi existente | Exemple de exercițiu și răspuns corect, nu capturi ale noului meniu |
| ../og-image-v2.jpg | 1200 × 630 | Imaginea folosită automat la distribuirea linkului |
| ../og-image.jpg | 1200 × 630 | Aceeași imagine, păstrată pentru compatibilitate cu linkurile vechi |

Imaginile promoționale se regenerează cu `npm run pr:generate`, folosind ilustrațiile SVG existente și scriptul din proiect. Nu includ promisiuni despre funcții nelansate.

## Texte gata de distribuit

### Postare de lansare

> 🤖 Faceți cunoștință cu Cifrel, partenerul de matematică din **MateVentura**!
>
> Povestea a început cu Matei, un băiețel pasionat de numere: întâi calcule pe foaie și pe degețele, apoi răspunsuri tastate într-un document Word. Când numerele au crescut, a apărut și Cifrel, gata de aventură!
>
> 🌱 **Învățare:** în ritmul copilului, fără timp sau scor, cu ajutor pas cu pas.
> 🚀 **Joc:** provocări cu adunări și scăderi, niveluri și clasament pe dispozitiv.
> 🛠️ **Aventură:** repară racheta lui Cifrel, piesă cu piesă, apoi lanseaz-o spre Numărilia!
> 💜 Gratuit, fără cont, fără reclame. Pentru copii de aproximativ 5–8 ani.
>
> **Numere mici. Aventuri mari.**
> Încercați împreună: https://gabibarzu.github.io/MateVentura/
>
> Ce i-a plăcut copilului și unde ar mai avea nevoie de ajutor?

### Pentru grupuri de părinți

> Bună! 👋 Vă invit să încercați **MateVentura cu Cifrel**, o aplicație gratuită de adunări și scăderi pentru copii de aproximativ 5–8 ani.
>
> Copilul poate învăța fără cronometru sau scor, cu explicații și ajutor pas cu pas, ori poate alege un joc pe niveluri. Cifrel îl încurajează să mai încerce când se încurcă.
>
> Nu cere cont și nu are reclame. Progresul și scorurile se păstrează în browserul de pe dispozitiv, nu într-un clasament online.
>
> 🤖 https://gabibarzu.github.io/MateVentura/
> Orice feedback după o încercare împreună cu copilul este binevenit!

### Pentru învățători și educatori

> **MateVentura cu Cifrel** este un instrument gratuit pentru exersarea adunării și scăderii:
>
> • Învățare adaptivă, fără timp sau scor, cu ajutor progresiv.
> • Joc pe trei niveluri și configurare personalizată.
> • Bulinuțe pentru numărat, feedback și încurajări.
> • Clasament local pentru jocurile pe niveluri; nu compară dispozitive sau clase online.
> • Funcționează în browser, fără cont, pe calculator, tabletă sau telefon.
>
> https://gabibarzu.github.io/MateVentura/
> Recomandăm alegerea modului potrivit ritmului fiecărui copil. Sugestiile din activitatea la clasă sunt binevenite.

### Texte scurte

- 🤖 Numere mici. Aventuri mari. Învață și joacă-te cu Cifrel! https://gabibarzu.github.io/MateVentura/
- 🌱 Adunări și scăderi în ritmul copilului, cu ajutor pas cu pas. MateVentura cu Cifrel — gratuit, fără cont.
- 🚀 Învățare sau Joc? Alege aventura matematică potrivită pentru tine!

Hashtag-uri: #MateVentura #Cifrel #Matematica #Copii #JocuriEducative #InvatarePrinJoaca

Text alternativ pentru poster: „MateVentura cu Cifrel. Numere mici. Aventuri mari. Robotul Cifrel invită copiii de 5–8 ani să exerseze adunări și scăderi, prin învățare pas cu pas și jocuri pe niveluri. Gratuit, fără cont și fără reclame.”

## Distribuirea linkului și cache-ul platformelor

1. Publică modificările prin fluxul de deployment al proiectului. Fișierele locale nu schimbă automat site-ul public.
2. Verifică sursa HTML publică: `og:title`, `og:description`, `og:image` și metadatele Twitter trebuie să conțină varianta nouă. Aceste etichete sunt statice și nu necesită JavaScript.
3. Imaginea trebuie să fie disponibilă public la https://gabibarzu.github.io/MateVentura/og-image-v2.jpg cu răspuns HTTP 200 și tip JPEG.
4. Facebook/Messenger: folosește [Sharing Debugger](https://developers.facebook.com/tools/debug/) și „Scrape Again” după publicare. Poate necesita autentificare.
5. WhatsApp și alte aplicații pot păstra previzualizarea veche. URL-ul nou al imaginii reduce cache-ul imaginii, dar nu forțează actualizarea cache-ului paginii. Verifică printr-un mesaj nou; actualizarea nu este garantată instantaneu.
6. Previzualizarea depinde de platformă, setări și accesul crawlerului. Nu este garantată în fiecare conversație și nu modifică mesajele deja trimise.

## Confidențialitate și formulări corecte

Progresul învățării și al misiunii cu racheta, numele folosit în clasament, scorurile și preferința de sunet sunt stocate local în browser. Nu sunt sincronizate între dispozitive și se pot pierde dacă datele site-ului sunt șterse.

Nu prezenta aplicația drept „fără nicio colectare de date”: găzduirea pe GitHub Pages implică cereri de rețea și politica furnizorului. „Fără cont și fără reclame” descrie funcționalitatea aplicației, nu o garanție despre infrastructura de găzduire.

## Idei de promovare

- Un clip scurt cu Învățare și Joc arată mai clar diferența dintre moduri.
- Respectă regulile grupurilor înainte de publicare; cere feedback concret.
- Pune linkul într-un loc ușor de găsit. Nu există o garanție că mutarea lui în comentarii crește distribuirea.
- Nu publica fața, numele complet sau datele copiilor fără acordurile necesare.