// importar modulos de terceros
const express = require('express');
const morgan = require('morgan');
// const { title } = require('process'); ???

// creamos una instancia del servidor Express
const app = express();

// usar un nuevo middleware para indicar a Express que queremos hacer peticiones POST
app.use(express.urlencoded({extended: true}));

// añado el middleware para que el cliente pueda hacer GETs a los recursos publicos en la carpeta 'public'
app.use(express.static('public'));

// base de datos de imagenes
const images = [];

// especificar a Express que quiero usar EJS como motor de plantillas 
app.set('view engine', 'ejs');

// usamos el middleware morgan para loggear las peticiones
app.use(morgan('tiny'));

// Petición GET a '/' --> renderizo la home.ejs 
app.get('/', (req, res) => {

     images.sort((a, b) => new Date(a.date) - new Date(b.date));
    
     // 2. usar en el home.ejs el forEach para iterar por todas las imagenes de la variable 'images'.
    // mostrar de momento solo el titulo
    res.render('home', {
        images
    });
})

// Petición GET a '/add-image-form' --> renderizo add-image-form.ejs 
app.get('/add-image-form', (req, res) => {
    res.render('new-image-form', {
        imageIsAdded: undefined
    });
})

// Petición POST a '/add-image-form' --> recibo los datos del formulario y actualizo mi "base de datos"  
app.post('/add-image-form', (req, res) => {
    // todos los datos nos vienen en un req.body
    console.log(req.body);

    // 1. actualizar el array 'images' con la información de req.body
    const { title, url, date } = req.body;

        // opción 1 (sacar los campos):
        images.push({
        title,
    // 3. añadir los otros campos del formulario y sus validaciones
        url,
        date
    }); // opción 2: images.push(req.body);

    // console.log('array de imagenes actualizado: ', images);

        // TO DO:
    // tras insertar la imagen dejaremos el formulario visible
    // Sort --> usarlo para ordenar las fotografías por fecha antes de responder al cliente


    res.render('new-image-form', {
        imageIsAdded: true
    }); // opción: res.send('Datos recibidos');

})



// OPCIONAL: nuevo endpoint para gestionar la búsqueda
app.get('/search', (req, res) => {
    
    // 1. coger el valor del parametro keyword de la query string
    const queryKeyword = document.querySelector('input[name="keyword"]');
    const searchQuery = new URLSearchParams(window.location.search).get('keyword');

    // 2. buscar en la base de datos usando el metodo filter
    const filteredImages = images.filter(image => {
        return image.title.toLowerCase().includes(searchQuery.toLowerCase());
    });

    // para las mayusculas-minusculas, dos opciones:
        // 1. usar el metodo toLowerCase() en el parametro de la query string o
        // 2. usar una expresión regular
        
    
    // 3. usar res.render para renderizar la vista home.ejs y pasarle el array de imagenes filtrado
    res.render('home',{
        images: filteredImages
    }
    );
});








// levanto servidor
app.listen(3001, () => {console.log('Servidor corriendo en el puerto 3001')});