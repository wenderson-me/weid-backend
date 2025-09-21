import mongoose from 'mongoose';
import ENV from './environment';

const connectOptions: mongoose.ConnectOptions = {

};

export const connectDB = async (): Promise<void> => {
  try {
    const connection = await mongoose.connect(ENV.MONGODB_URI, connectOptions);

    const { host, port, name } = connection.connection;
    console.log(`✅ MongoDB Connected: ${host}:${port}/${name}`);

    setupConnectionHandlers();

  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    process.exit(1);
  }
};

const setupConnectionHandlers = () => {
  const db = mongoose.connection;

  db.on('disconnected', () => {
    console.warn('⚠️ MongoDB disconnected. Attempting to reconnect...');
  });

  db.on('error', (err) => {
    console.error(`❌ MongoDB Error: ${err.message}`);

    if (err.name === 'MongoServerSelectionError') {
      console.error('❌ Fatal MongoDB Error. Exiting application.');
      process.exit(1);
    }
  });

  db.on('reconnected', () => {
    console.log('✅ MongoDB reconnected successfully');
  });
};

export const closeDB = async (): Promise<void> => {
  try {
    await mongoose.connection.close();
    console.log('✅ MongoDB connection closed');
  } catch (error) {
    console.error(`❌ Error closing MongoDB connection: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export default connectDB;