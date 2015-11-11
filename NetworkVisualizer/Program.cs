using System.IO;

namespace NetworkVisualizer {
    class Program {
        public static void Main(string[] args) {
            string dirData = @args[0] + Path.DirectorySeparatorChar;           // Path of directory that containes SQLite DB files
            string[] sqliteDBs = Directory.GetFiles(dirData, "*.sqlite");

            // Make JSON network files from SQLite databases
            foreach (string dbFile in sqliteDBs) {
                JSONBuilder jsonBuilder = new JSONBuilder(dbFile);
                jsonBuilder.run();

                //UsageDataMaker usageDataMaker = new UsageDataMaker(dbFile);
                //usageDataMaker.run();
            }
        }
    }
}
