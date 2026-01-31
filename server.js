import http from 'http';
import app from './src/app.js';
import { PORT, NODE_ENV } from './src/config/env.js';
import { connectDB } from './src/config/mongoose.js';

const startServer = async () => {
    try {
        await connectDB();

        const server = http.createServer(app);

        // Start listening
        await new Promise((resolve) => {
            server.listen(PORT, () => {
                console.log(`🚀 Server running in ${NODE_ENV} mode at http://localhost:${PORT}`);
                resolve();
            });
        });

        process.on('unhandledRejection', (err) => {
            console.error('💥 UNHANDLED REJECTION:', err);
            shutdown(server);
        });

        process.on('uncaughtException', (err) => {
            console.error('💥 UNCAUGHT EXCEPTION:', err);
            shutdown(server);
        });

        return server;

    } catch (err) {
        console.error('❌ Server failed to start:', err);
        process.exit(1);
    }
};

const shutdown = (server) => {
    console.log('🔻 Shutting down server...');

    server.close(() => {
        console.log('✅ Server closed cleanly');
        process.exit(1);
    });

    setTimeout(() => {
        console.error('⏱ Force shutdown');
        process.exit(1);
    }, 10000);
};

await startServer();
