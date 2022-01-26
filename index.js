// Bring in the express server and create application
let express = require('express');
let app = express();
let pieRepo = require('./repos/pierepo');
let errorHelper = require('./helpers/errorHelpers');

const winston = require('winston')
const ecsFormat = require('@elastic/ecs-winston-format')

const logger = winston.createLogger({
    level: 'debug',
    format: ecsFormat({ convertReqRes: true }),
    transports: [
        //new winston.transports.Console(),
        new winston.transports.File({
            //path to log file
            filename: 'logs/log.json',
            level: 'debug'
        })
    ]
})

// Use the Express Router object
let router = express.Router();

// Configure middleware to support JSON data parsing in request object
app.use(express.json());

// Create GET to return a list of all pies
router.get('/', function (req, res, next) {
    pieRepo.get(function (data) {
        res.status(200).json({
            "status": 200,
            "statusText": "OK",
            "message": "All pies retrieved.",
            "data": data
        });
        logger.info('handled request', { req, res })
    }, function(err) {
        next(err);
    });
});

// Create GET/search?id=n&name=str to search for pies by 'id' and/or 'name'
router.get('/search', function (req, res, next) {
    let searchObject = {
        "id": req.query.id,
        "name": req.query.name
    };

    pieRepo.search(searchObject, function (data) {
        res.status(200).json({
            "status": 200,
            "statusText": "OK",
            "message": "All pies retrieved.",
            "data": data
        });
        logger.info('handled request', { req, res })
    }, function (err) {
        next(err);
    });
});

// Create GET/id to return a single pie
router.get('/:id', function (req, res, next) {
    pieRepo.getById(req.params.id, function (data) {
        if (data) {
            res.status(200).json({
                "status": 200,
                "statusText": "OK",
                "message": "Single pie retrieved.",
                "data": data
            });
            logger.info('handled request', { req, res })
        }
        else {
            res.status(404).json({
                "status": 404,
                "statusText": "Not Found",
                "message": "The pie '" + req.params.id + "' could not be found.",
                "error": {
                    "code": "NOT_FOUND",
                    "message": "The pie '" + req.params.id + "' could not be found."
                }
            });
            logger.error('error occured', { req, res })
        }
    }, function(err) {
        next(err);
    });
});

// Create POST/id to add new pie
router.post('/', function (req, res, next) {
    pieRepo.insert(req.body, function(data) {
        res.status(201).json({
            "status": 201,
            "statusText": "Created",
            "messages": "New Pie Added.",
            "data": data
        });
        logger.info('handled request', { req, res })
    }, function(err) {
        next(err);
    });
});

// Create PUT/id to update a pie
router.put('/:id', function (req, res, next) {
    pieRepo.getById(req.params.id, function (data) {
        if (data) {
            // Attempt to update the data
            pieRepo.update(req.body, req.params.id, function (data) {
                res.status(200).json({
                    "status": 200,
                    "statusText": "OK",
                    "message": "Pie '" + req.params.id + "' updated.",
                    "data": data
                });
            });
            logger.info('handled request', { req, res })
        }
        else {
            res.status(404).json({
                "status": 404,
                "statusText": "Not Found",
                "message": "The pie '" + req.params.id + "' could not be found.",
                "error": {
                    "code": "NOT_FOUND",
                    "message": "The pie '" + req.params.id + "' could not be found."
                }
            });
            logger.error('error occured', { req, res })
        }
    }, function(err) {
        next(err);
    });
})

// Create DELETE/id to delete a pie
router.delete('/:id', function (req, res, next) {
    pieRepo.getById(req.params.id, function (data) {
        if (data) {
            // Attempt to delete the data
            pieRepo.delete(req.params.id, function (data) {
                res.status(200).json({
                    "status": 200,
                    "statusText": "OK",
                    "message": "The pie '" + req.params.id + "' is deleted.",
                    "data": "Pie '" + req.params.id + "' deleted."
                });
            });
            logger.info('handled request', { req, res })
        }
        else {
            res.status(404).json({
                "status": 404,
                "statusText": "Not found",
                "message": "The pie '" + req.params.id + "' could not be found.",
                "error": {
                    "code": "NOT_FOUND",
                    "message": "The pie '" + req.params.id + "' could not be found."
                }
            });
            logger.error('error occured', { req, res })
        }
    });
})

// Create PATCH/id to update properties on a pie
router.patch('/:id', function (req, res, next) {
    pieRepo.getById(req.params.id, function (data) {
        if (data) {
            // Attempt to update the data
            pieRepo.update(req.body, req.params.id, function (data) {
                res.status(200).json({
                    "status": 200,
                    "statusText": "OK",
                    "message": "Pie '" + req.params.id + "' patched.",
                    "data": data
                });
            });
            logger.info('handled request', { req, res })
        }
    })
})

// Configure router so all routes are prefixed with /api/v1
app.use('/api', router);

// Configure exception logger to console
app.use(errorHelper.logErrorsToConsole);

// Configure exception logger to file
app.use(errorHelper.logErrorsToFile);

// Configure client error handler
app.use(errorHelper.clientErrorHandler);

// Configure catch-all exception middleware last
app.use(errorHelper.errorHandler);

// Create server to listen on port 5000
var server = app.listen(5001, function () {
    console.log('Node server is running on http://localhost:5001..');
});