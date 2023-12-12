const mysql = require('mysql');
const express = require('express');
const app = express();
const port = 3000;
const path = require('path');

app.use(express.static(path.join(__dirname, 'public')));

// Configuración de la conexión a MySQL
const connection = mysql.createConnection({
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: '',
  database: 'lab15'
});

// Conexión a la base de datos
connection.connect((error) => {
    if (error) {
        console.error('Error al conectar a MySQL: ', error);
        return;
    }
    console.log('Conexión exitosa a MySQL');
});

// Configurar Pug como motor de plantillas
app.set('view engine', 'pug');
app.set('views', './views');

// Configurar Express.js para servir archivos estáticos desde la carpeta "public"
app.use(express.static('public'));

// Middleware para procesar datos enviados en formularios
app.use(express.urlencoded({ extended: true }));

// Ruta principal
app.get('/', (req, res) => {
    
    const consultaCursos = 'SELECT * FROM curso';

    connection.query(consultaCursos, (errorCursos, resultadosCursos) => {
        if (errorCursos) {
            console.error('Error al obtener la lista de cursos: ', errorCursos);
            return;
        }

        
        const consultaAlumnos = `
            SELECT alumno.alumno_id, alumno.alumno_nombre, alumno.alumno_edad, alumno.alumno_telefono, alumno.alumno_correo, curso.curso_nombre
            FROM alumno
            JOIN inscripcion ON alumno.alumno_id = inscripcion.inscripcion_alumno_id
            JOIN curso ON inscripcion.inscripcion_curso_id = curso.curso_id
        `;

        connection.query(consultaAlumnos, (errorAlumnos, resultadosAlumnos) => {
            if (errorAlumnos) {
                console.error('Error al obtener los datos de los alumnos: ', errorAlumnos);
                return;
            }

            // Renderizar la vista y pasar los resultados a través del objeto locals
            res.render('index', { datos: resultadosAlumnos, cursos: resultadosCursos });
        });
    });
});

// Ruta para mostrar la vista de agregar alumno
app.get('/agregar/alumno', (req, res) => {
    // Realizar consulta a la base de datos para obtener la lista de cursos
    const consultaCursos = 'SELECT * FROM curso';

    connection.query(consultaCursos, (errorCursos, resultadosCursos) => {
        if (errorCursos) {
            console.error('Error al obtener la lista de cursos: ', errorCursos);
            return;
        }

        // Renderizar la vista de agregar alumno y pasar la lista de cursos
        res.render('agregarAlumno', { cursos: resultadosCursos });
    });
});

// Ruta para manejar la solicitud POST para agregar alumno
app.post('/agregar/alumno', (req, res) => {
    const nuevoDato = {
        nombre: req.body.nuevoNombre,
        edad: req.body.nuevaEdad,
        telefono: req.body.nuevoTelefono,
        correo: req.body.nuevoCorreo
    };

    const idCurso = req.body.idCurso;

    // Consulta SQL de inserción en la tabla "alumnos"
    const consultaAlumnos = 'INSERT INTO alumno (alumno_nombre, alumno_edad, alumno_telefono, alumno_correo) VALUES (?, ?, ?, ?)';

    connection.query(consultaAlumnos, [nuevoDato.nombre, nuevoDato.edad, nuevoDato.telefono, nuevoDato.correo], (errorAlumnos, resultsAlumnos) => {
        if (errorAlumnos) {
            console.error('Error al insertar datos en la tabla "alumnos": ', errorAlumnos);
            return;
        }

        const idAlumnoInsertado = resultsAlumnos.insertId;

        // Consulta SQL de inserción en la tabla "inscripciones"
        const consultaInscripciones = 'INSERT INTO inscripcion (inscripcion_alumno_id, inscripcion_curso_id) VALUES (?, ?)';

        connection.query(consultaInscripciones, [idAlumnoInsertado, idCurso], (errorInscripciones, resultsInscripciones) => {
            if (errorInscripciones) {
                console.error('Error al insertar datos en la tabla "inscripcion": ', errorInscripciones);
                return;
            }

            console.log('Alumno agregado exitosamente');
            res.redirect('/');
        });
    });
});

// Ruta para mostrar la vista de agregar curso
app.get('/agregar/curso', (req, res) => {
    // Renderizar la vista de agregar curso
    res.render('agregarCurso');
});

// Ruta para manejar la solicitud POST para agregar curso
app.post('/agregar/curso', (req, res) => {
    const nuevoCurso = {
        nombreCurso: req.body.nuevoNombreCurso,
        descripcionCurso: req.body.nuevaDescripcionCurso
    };

    // Consulta SQL de inserción en la tabla "cursos"
    const consultaCursos = 'INSERT INTO curso (curso_nombre, curso_descripcion) VALUES (?, ?)';

    connection.query(consultaCursos, [nuevoCurso.nombreCurso, nuevoCurso.descripcionCurso], (errorCursos, resultsCursos) => {
        if (errorCursos) {
            console.error('Error al insertar datos en la tabla "curso": ', errorCursos);
            return;
        }

        console.log('Curso agregado exitosamente');
        res.redirect('/');
    });
});

// Ruta para mostrar la vista de editar alumno
app.get('/editar/alumno/:id', (req, res) => {
    const idAlumno = req.params.id;

    // Realizar consulta a la base de datos para obtener la información del alumno y la lista de cursos
    const consultaAlumno = `
        SELECT alumno.alumno_id, alumno.alumno_nombre, alumno.alumno_edad, alumno.alumno_telefono, alumno.alumno_correo, curso.curso_id AS curso_id
        FROM alumno
        LEFT JOIN inscripcion ON alumno.alumno_id = inscripcion.inscripcion_alumno_id
        LEFT JOIN curso ON inscripcion.inscripcion_curso_id = curso.curso_id
        WHERE alumno.alumno_id = ?
    `;

    connection.query(consultaAlumno, [idAlumno], (errorAlumno, resultadoAlumno) => {
        if (errorAlumno) {
            console.error('Error al obtener los datos del alumno: ', errorAlumno);
            return;
        }

        // Realizar consulta a la base de datos para obtener la lista de cursos
        const consultaCursos = 'SELECT * FROM curso';

        connection.query(consultaCursos, (errorCursos, resultadosCursos) => {
            if (errorCursos) {
                console.error('Error al obtener la lista de cursos: ', errorCursos);
                return;
            }

            // Renderizar la vista de editar alumno y pasar la información del alumno y la lista de cursos
            res.render('editarAlumno', { alumno: resultadoAlumno[0], cursos: resultadosCursos });
        });
    });
});

// Ruta para manejar la solicitud POST para editar alumno
app.post('/editar/alumno/:id', (req, res) => {
    const idAlumno = req.params.id;
    const datosEditados = {
        nombre: req.body.editarNombre,
        edad: req.body.editarEdad,
        telefono: req.body.editarTelefono,
        correo: req.body.editarCorreo,
        idCurso: req.body.editarIdCurso
    };

    // Consulta SQL para actualizar los datos del alumno en la tabla "alumnos"
    const consultaActualizarAlumno = `
        UPDATE alumno
        SET alumno_nombre = ?, alumno_edad = ?, alumno_telefono = ?, alumno_correo = ?
        WHERE alumno_id = ?
    `;

    connection.query(consultaActualizarAlumno, [datosEditados.nombre, datosEditados.edad, datosEditados.telefono, datosEditados.correo, idAlumno], (errorActualizarAlumno) => {
        if (errorActualizarAlumno) {
            console.error('Error al actualizar datos del alumno: ', errorActualizarAlumno);
            return;
        }

        // Consulta SQL para actualizar la inscripción del alumno en la tabla "inscripciones"
        const consultaActualizarInscripcion = `
            UPDATE inscripcion
            SET inscripcion_curso_id = ?
            WHERE inscripcion_alumno_id = ?
        `;

        connection.query(consultaActualizarInscripcion, [datosEditados.idCurso, idAlumno], (errorActualizarInscripcion) => {
            if (errorActualizarInscripcion) {
                console.error('Error al actualizar inscripción del alumno: ', errorActualizarInscripcion);
                return;
            }

            console.log('Alumno actualizado exitosamente');
            res.redirect('/');
        });
    });
});

// Ruta para manejar la solicitud POST para eliminar alumno
app.post('/eliminar/alumno/:id', (req, res) => {
    const idAlumno = req.params.id;

    // Consulta SQL para eliminar al alumno de la tabla "alumnos" y su inscripción de la tabla "inscripciones"
    const consultaEliminarAlumno = 'DELETE FROM alumno WHERE alumno_id = ?';
    const consultaEliminarInscripcion = 'DELETE FROM inscripcion WHERE alumno_id = ?';

    connection.query(consultaEliminarInscripcion, [idAlumno], (errorEliminarInscripcion) => {
        if (errorEliminarInscripcion) {
            console.error('Error al eliminar inscripción del alumno: ', errorEliminarInscripcion);
            return;
        }

        connection.query(consultaEliminarAlumno, [idAlumno], (errorEliminarAlumno) => {
            if (errorEliminarAlumno) {
                console.error('Error al eliminar alumno: ', errorEliminarAlumno);
                return;
            }

            console.log('Alumno eliminado exitosamente');
            res.redirect('/');
        });
    });
});

// Ruta para mostrar la vista de ejecutar consultas
app.get('/consultas', (req, res) => {
    res.render('consultas');
});

// Ruta para manejar la solicitud POST para ejecutar consultas
app.post('/consultas', (req, res) => {
    const consulta = req.body.consulta;

    // Verificar que la consulta no esté vacía
    if (!consulta.trim()) {
        res.render('consultas', { error: 'La consulta está vacía' });
        return;
    }

    // Ejecutar la consulta en la base de datos
    connection.query(consulta, (error, resultados) => {
        if (error) {
            console.error('Error al ejecutar la consulta: ', error);
            res.render('consultas', { error: 'Error al ejecutar la consulta' });
            return;
        }

        // Renderizar la vista de consultas y pasar los resultados
        res.render('consultas', { resultados });
    });
});

// Iniciar el servidor
app.listen(port, () => {
    console.log(`Servidor en ejecución en http://localhost:${port}`);
});
