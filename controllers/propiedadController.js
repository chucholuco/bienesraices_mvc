import { validationResult } from 'express-validator'
import { Precio, Categoria, Propiedad } from '../models/index.js'


const admin = async (req, res) => {
  const { id } = req.usuario;

  const propiedades = await Propiedad.findAll({
    where: {
      usuarioId: id,
    },
    include: [
      {model: Categoria, as: 'categoria'},
      {model: Precio, as: 'precio'}
    ]
  });

  res.render("propiedades/admin", {
    pagina: "Mis propiedades",
    propiedades
  });
};

const crear = async (req, res) => {
    // Consultar modelo de precio y categorias
    const [categorias, precios] = await Promise.all([
        Categoria.findAll(),
        Precio.findAll()
    ])

    res.render('propiedades/crear', {
        pagina: 'Crear Propiedad',        
        csrfToken: req.csrfToken(),
        categorias,
        precios,
        datos: {}
    })
}

const guardar = async (req, res) => {
  // Validacion
  let resultado = validationResult(req);
  if (!resultado.isEmpty()) {
    // Consultar modelo de precio y categorias
    const [categorias, precios] = await Promise.all([
      Categoria.findAll(),
      Precio.findAll(),
    ]);
    return res.render("propiedades/crear", {
      pagina: "Crear Propiedad",      
      csrfToken: req.csrfToken(),
      categorias,
      precios,
      datos: req.body,
      errores: resultado.array()
    });
  }

  // Crear un registro
  const {
    titulo, descripcion, habitaciones, estacionamiento,
    wc, calle, lat, lng, categoria: categoriaId, precio: precioId, 
  } = req.body;

  const {id: usuarioId} = req.usuario

  try {
    const propiedadGuardada = await Propiedad.create({
        titulo,
        descripcion,
        habitaciones,
        estacionamiento,
        wc,
        calle,
        lat,
        lng,
        categoriaId,
        precioId,
        usuarioId,
        imagen: ''
    })

    const { id } = propiedadGuardada
    res.redirect(`/propiedades/agregar-imagen/${id}`)
  } catch (error) {
    console.log(error)
  }

};

const agregarImagen = async (req, res) => {
  // Validar que la propiedad exista
  const { id } = req.params
  const propiedad = await Propiedad.findByPk(id)
  if (!propiedad) {
    return res.redirect('/mis-propiedades')
  }

  // Validar que la propiedad no este publicada
  if (propiedad.publicado) {
    return res.redirect('/mis-propiedades')
  }

  // Validar que la propiedad pertenece a quien visita esta pagina
  if (req.usuario.id.toString() !== propiedad.usuarioId.toString()) {
    return res.redirect('/mis-propiedades')
  }
  

  res.render('propiedades/agregar-imagen', {
    pagina: `Agregar Imagen: ${propiedad.titulo}`, 
    propiedad,
    csrfToken: req.csrfToken()
  })
}

const almacenarImagen = async (req, res, next) => {
  // Validar que la propiedad exista
  const { id } = req.params
  const propiedad = await Propiedad.findByPk(id)
  if (!propiedad) {
    return res.redirect('/mis-propiedades')
  }

  // Validar que la propiedad no este publicada
  if (propiedad.publicado) {
    return res.redirect('/mis-propiedades')
  }

  // Validar que la propiedad pertenece a quien visita esta pagina
  if (req.usuario.id.toString() !== propiedad.usuarioId.toString()) {
    return res.redirect('/mis-propiedades')
  }

  try {
    // Almacenar la imagen y publicar propiedad
    propiedad.imagen = req.file.filename
    propiedad.publicado = true

    await propiedad.save()

    next()

  } catch (error) {
    console.log(error)
  }

}


export {
    admin,
    crear,
    guardar,
    agregarImagen,
    almacenarImagen
}