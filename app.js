/* MÓDULOS DE TERCEROS*/
const express = require('express');
const morgan = require('morgan');
const mongoose = require('mongoose');

// TODO: 1. Conectar a la base de datos utilizando mongoose 
main().catch(err => console.log(err));

// Variable global para almacenar el modelo
let Image;

async function main() {
    await mongoose.connect('mongodb+srv://dani:dani@cluster0.hyxsuo4.mongodb.net/ironhackDB');
    
    // TODO 2: Crear el Schema que representa nuestras imagenes. 
    // - title , tipo string y de 30 carácteres como mucho
    // - url, de tipo string y validando contra expresión regular de URL
    // - date, de tipo Date 
    // - dominantColor, de tipo Array/String
    // - TODOS los campos/propiedades son requeridos
    const imageSchema = new mongoose.Schema({
        title: {
            type: String,
            required: true,
            maxLength: 30,
            trim: true, // quita los espacios en blanco al principio y final de string
            match: /[0-9A-Za-z\s_]+/
        },
        date: {
            type: Date,
            required: true
        },
        url: {
            type: String,
            required: true,
            match: /^(https):\/\/[^\s/$.?#].[^\s]*$/i
        },
        dominantColor: {
            type: [Number], // [12, 45, 255]
            required: true,
        }
    });

    // TODO 3: Asociar el Schema al Model. Asociar el Schema a una colección de MongoDB. Llamaremos a la colección 'images'
    Image = mongoose.model('Image', imageSchema);

    // TODO 4: Crea una imagen inmediatamente en este punto y comprueba que se ha creado en tu base de datos de MongoDB 
    // new Image({})... image.save()
    // const document = new Image({
    //     title: "Gato",
    //     date: new Date('2024-02-01'),
    //     url: "https://images.pexels.com/photos/104827/cat-pet-animal-domestic-104827.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
    //     dominantColor: [200, 200, 200]
    // });

    // await document.save();

    
}

const {getColorFromURL} = require('color-thief-node');

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

// variable para indicar en qué puerto tiene que escuchar nuestra app
const PORT = process.env.PORT || 3001;

/** ENDPOINTS */

// Petición GET a '/' --> renderizo la home.ejs 
app.get('/', async (req, res) => {
    
    // 2. usar en el home.ejs el forEach para iterar por todas las imagenes de la variable 'images'.
    // mostrar de momento solo el titulo

    // Iteración 3: Usar Image.find para recuperar todas las imágenes de la base de datos. 
    // Pasarla a la vista estas imágenes. Cuando lo consigáis, 
    // probad de modificar la consulta para ordenarlas por fecha decreciente
    const images = await Image.find().sort({date: -1});
    
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
    // todos los datos nos vienen en un req.body
    console.log(req.body);
    let dominantColor;
    let isRepeated;
    // 1. actualizar el array 'images' con la información de req.body
    const { title, url, date } = req.body;
    
    try {
    // OPCIONAL: validación del lado servidor de que realmente nos han enviado un title
    // expresión regular para validar el formato del title
    const titleRegex = /^[0-9A-Z\s_]+$/i;

    // si el title no cumple la expresion, lanzo un error
    if (title.length > 30 || !titleRegex.test(title)) {
        return res.status(400).send('Algo ha salido mal...');
    }

    // extraer color con el modulo color-thief-node:
    dominantColor = await getColorFromURL(url);
    } catch (err) {
        console.error("Ha ocurrido un error: ", err);
        res.send('We werent able to get the dominant color from image with URL: ' + url + ". Please, go back and try another URL.");
        // redirigimos la respuesta que le damos al cliente a nuestro manejador de errores:
        return next(err);
    }

    // comprobar si url está repetida:
    // Iteración 4: Buscar en la base datos si existe UN documento que tenga la misma URL que la imagen que queremos agergar. En tal caso --> isRepeated = true;
    isRepeated = await Image.findOne({ url: url }) !== null;

    // si está repetida, lanzo un error
    if (isRepeated){
        res.render('new-image-form', {
            imageIsAdded: false,
            imageIsRepeated: url
        });
    } 
    
    // si no está repetida, todo sigue correctamente
    else {
        // opción 1 (sacar los campos):       
        // opción 2: images.push(req.body);

    // Iteración 2; Mongoose-> Recuperar la información del formulario y crear un nuevo documento Image y guardarlo en base de datos
    const document = new Image ({
        title,
        date: new Date(date),
        url,
        dominantColor
    });

    // guardar el documento
    await document.save();

        res.render('new-image-form', {
            imageIsAdded: true,
            imageIsRepeated: undefined
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
app.get('/search', (req, res) => {
    
    // 1. coger el valor del parametro keyword de la query string
    const queryKeyword = req.query.keyword;
    // const searchQuery = new URLSearchParams(window.location.search).get('keyword');

    // 2. buscar en la base de datos usando el metodo filter

        // Otra opción para las mayus-minus: usar el metodo toLowerCase() en el parametro de la query string.
    
    // 3. usar res.render para renderizar la vista home.ejs y pasarle el array de imagenes filtrado
    res.render('home',{
    });
});


// uso de middleware para gestionar cualquier error imprevisto de la app y fallar de forma "grácil"
app.use((err, req, res, next) => {
    console.log(err.stack)
    res.status(500).send('<p>Oops! Something went wrong. Developers will be informed. Thanks for your patience and try back again later, or go back to the <a href="/">home page</a></p>')
    });

// levanto servidor
app.listen(PORT, () => {
    console.log('Servidor corriendo en el puerto ' + PORT);
});