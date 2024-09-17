// importar modulos de terceros
const express = require('express');
const morgan = require('morgan');
const {getColorFromURL} = require('color-thief-node');

// objetos de biblio mongodb:
const {MongoClient, ServerApiVersion} = require("mongodb");
// connection string
const uri = "mongodb+srv://dani:dani@cluster0.hyxsuo4.mongodb.net/";
// objeto MongoClient + MongoClientOptions
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
    }
    );

// variable global para gestionar la bbdd
let database;

// creamos una instancia del servidor Express
const app = express();

// usar un nuevo middleware para indicar a Express que queremos hacer peticiones POST
app.use(express.urlencoded({extended: true}));

// añado el middleware para que el cliente pueda hacer GETs a los recursos publicos en la carpeta 'public'
app.use(express.static('public'));

// especificar a Express que quiero usar EJS como motor de plantillas 
app.set('view engine', 'ejs');

// usamos el middleware morgan para loggear las peticiones
app.use(morgan('tiny'));

// Petición GET a '/' --> renderizo la home.ejs 
app.get('/', async (req, res) => {
    
    // 2. usar en el home.ejs el forEach para iterar por todas las imagenes de la variable 'images'.
    // mostrar de momento solo el titulo

    //TODO2: ahora las imagenes que pasamos a la vista tienen que venir de la instancia de mongo (usar find)
    const images = await database.collection('images').find().toArray();

    res.render('home', {
        images
    });
})

// Petición GET a '/add-image-form' --> renderizo add-image-form.ejs 
app.get('/add-image-form', (req, res) => {
    res.render('new-image-form', {
        imageIsAdded: undefined,
        imageIsRepeated: undefined
    });
})

// Petición POST a '/add-image-form' --> recibo los datos del formulario y actualizo mi "base de datos"  
app.post('/add-image-form', async (req, res) => {

    let dominantColor;
    let isRepeated;
    // 1. actualizar el array 'images' con la información de req.body
    const { title, url, date } = req.body;

    // OPCIONAL: validación del lado servidor de que realmente nos han enviado un title
    // expresión regular para validar el formato del title
        const titleRegex = /^[0-9A-Z\s_]+$/i;

    // si el title no cumple la expresion, lanzo un error
    if (title.length > 30 || !titleRegex.test(title)) {
        return res.status(400).send('Algo ha salido mal...');
    }

        // TODO0:
    // ordenar las fotografías por fecha de más reciente a más antigua
    //images.sort((a, b) => new Date(b.date) - new Date(a.date));

    // extraer color con el modulo color-thief-node:
    try {
        dominantColor = await getColorFromURL(url);
    }
    catch (err) {
        console.error("Ha ocurrido un error: ", err);
        res.send('We werent able to get the dominant color from image with URL: ' + url + ". Please, go back and try another URL.");
        // redirigimos la respuesta que le damos al cliente a nuestro manejador de errores:
        return next(err);
    }

    // comprobar si url está repetida:
    // hacer un find a bbdd para comprobar si existe una image con la url que nos pasan
    const image = await database.collection('images').findOne({
        url: url
    })

    // si no existe una imagen con dicha url --> findOne devuelve null
    // si image es diferente a null (!=) --> la imagen está repetida
    isRepeated = image != null;

    // si está repetida, lanzo un error
    if (isRepeated){
        res.render('new-image-form', {
            imageIsAdded: false,
            imageIsRepeated: url
        });
    } 
    
    // si no está repetida, todo sigue correctamente
    else {
        // // opción 1 (sacar los campos):
        // images.push({
        //     title,
        // // 3. añadir los otros campos del formulario y sus validaciones
        //     url,
        //     date,
        //     dominantColor
        // }); 
        
        // TODO1: insertar un nuevo documento en la colección 'images' de la bbdd 'ironhack'
        database.collection("images").insertOne({
            title, 
            url,
            date: new Date(date),
            dominantColor
     });

        // opción 2: images.push(req.body);

        res.render('new-image-form', {
            imageIsAdded: true,
            imageIsRepeated: false
        });
    }
    

});

/**
 * 
 * @param {string} s1 String principal. Cadena de texto donde vamos a realizar la búsqueda 
 * @param {string} s2 String secundario.  
 * @returns string Retorna true si s2 está contenido en s1. En caso contrario retorna false
 */
function isSubstring(s1, s2) {
    const regexp = new RegExp(s2, "i");

    // Busco en el string s1 si existe el string s2
    return regexp.test(s1);
}

// OPCIONAL: petición GET para gestionar la búsqueda
app.get('/search', async (req, res) => {
    
    // 1. coger el valor del parametro keyword de la query string
    const queryKeyword = req.query.keyword;
    // const searchQuery = new URLSearchParams(window.location.search).get('keyword');

    // 2. buscar en la base de datos usando el metodo filter
    
    // const image = await database.collection('images').findOne((image) => isSubstring(image.title, queryKeyword))
    // const filteredImages = image

        // Otra opción para las mayus-minus: usar el metodo toLowerCase() en el parametro de la query string.
    
    // 3. usar res.render para renderizar la vista home.ejs y pasarle el array de imagenes filtrado
    res.render('home',{
        images: filteredImages
    });
});


// uso de middleware para gestionar cualquier error imprevisto de la app y fallar de forma "grácil"
app.use((err, req, res, next) => {
    console.log(err.stack)
    res.status(500).send('<p>Oops! Something went wrong. Developers will be informed. Thanks for your patience and try back again later, or go back to the <a href="/">home page</a></p>')
});





// levanto servidor
app.listen(3001, async () => {
    console.log('Sever up at 3001');
    try {
        await client.connect();
        database = client.db("ironhack");
        console.log('Conectado a MongoDB');
    } catch (error) {
        console.log('Error al conectarse a MongoDB', error);
    }
});