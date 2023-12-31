import express from "express";
import { admin, crear, guardar, agregarImagen, almacenarImagen, 
         editar, guardarCambios, eliminar, cambiarEstado, 
         mostrarPropiedad, enviarMensaje, verMensajes } from "../controllers/propiedadController.js";
import { body } from "express-validator";
import protegerRruta from '../middleware/protegerRuta.js'
import upload from '../middleware/subirImagen.js'
import identificarUsuario from '../middleware/identificarUsuario.js'

const router = express.Router();

router.get("/mis-propiedades", protegerRruta, admin);
router.get("/propiedades/crear", protegerRruta, crear);

router.post("/propiedades/crear", protegerRruta,
  body("titulo").notEmpty().withMessage("El titulo del anuncio es obligatorio"),
  body("descripcion")
    .notEmpty().withMessage("La descripcion no puede ir vacia")
    .isLength({max:200}).withMessage('La Descripcion es muy larga'),
  body('categoria').isNumeric().withMessage('Selecciona una categoria'),
  body('precio').isNumeric().withMessage('Selecciona un rango de precios'),
  body('habitaciones').isNumeric().withMessage('Selecciona la cantidad de habitaciones'),
  body('estacionamiento').isNumeric().withMessage('Selecciona la cantidad de estacionamientos'),
  body('wc').isNumeric().withMessage('Selecciona la cantidad de baños'),
  body('lat').notEmpty().withMessage('Ubica la propiedad en el mapa'),
  guardar
);

router.get('/propiedades/agregar-imagen/:id', protegerRruta, agregarImagen)

router.post('/propiedades/agregar-imagen/:id', 
  protegerRruta,
  upload.single('imagen'),
  almacenarImagen
)

router.get('/propiedades/editar/:id', protegerRruta, editar)

router.post("/propiedades/editar/:id", protegerRruta,
  body("titulo").notEmpty().withMessage("El titulo del anuncio es obligatorio"),
  body("descripcion")
    .notEmpty().withMessage("La descripcion no puede ir vacia")
    .isLength({max:200}).withMessage('La Descripcion es muy larga'),
  body('categoria').isNumeric().withMessage('Selecciona una categoria'),
  body('precio').isNumeric().withMessage('Selecciona un rango de precios'),
  body('habitaciones').isNumeric().withMessage('Selecciona la cantidad de habitaciones'),
  body('estacionamiento').isNumeric().withMessage('Selecciona la cantidad de estacionamientos'),
  body('wc').isNumeric().withMessage('Selecciona la cantidad de baños'),
  body('lat').notEmpty().withMessage('Ubica la propiedad en el mapa'),
  guardarCambios
);

router.post('/propiedades/eliminar/:id', protegerRruta, eliminar)

router.put('/propiedades/:id', protegerRruta, cambiarEstado)

// Area publica
router.get('/propiedad/:id', identificarUsuario, mostrarPropiedad)

router.post('/propiedad/:id', 
  identificarUsuario, 
  body('mensaje').isLength({min:10}).withMessage("El mensaje no puede ir vacio o es muy corto"),
  enviarMensaje)

router.get('/mensajes/:id', protegerRruta, verMensajes)  


export default router;