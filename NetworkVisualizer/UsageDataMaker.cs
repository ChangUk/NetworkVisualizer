using System;
using System.Collections.Generic;
using System.IO;

namespace NetworkVisualizer {
    public class UsageDataMaker {
        private string filename;

        public UsageDataMaker(string filename) {
            this.filename = filename;
        }

        public void run() {
            Console.WriteLine("Making usage data file per user...");
            string egoUser = Path.GetFileNameWithoutExtension(filename);
            Console.WriteLine(egoUser);

            try {
                // To handle the exception while the program runs
                if (!File.Exists(filename))
                    throw new FileNotFoundException(filename);

                // Get DB connection
                SQLiteAdapter dbAdapter = new SQLiteAdapter(filename);

                // File to write
                string dirData = Directory.GetParent(filename).ToString() + Path.DirectorySeparatorChar;
                StreamWriter writer = new StreamWriter(dirData + egoUser + ".history");
                writer.WriteLine("year\tmonth\tcount");

                // Get tweeting history of ego user
                var tweetingHistory = dbAdapter.getTweetingHistory(egoUser);
                if (tweetingHistory == null || tweetingHistory.Count == 0)
                    return;

                var data = new Dictionary<int, Dictionary<int, int>>();
                int firstYear = tweetingHistory[0].Value.Year;
                int lastYear = tweetingHistory[tweetingHistory.Count - 1].Value.Year;
                for (int year = firstYear; year <= lastYear; year++) {
                    data.Add(year, new Dictionary<int, int>());
                    for (int month = 1; month <= 12; month++)
                        data[year].Add(month, 0);
                }

                // Count records by year and month
                foreach (var record in tweetingHistory) {
                    DateTime date = record.Value;
                    data[date.Year][date.Month] += 1;
                }

                // File writing
                for (int year = firstYear; year <= lastYear; year++) {
                    for (int month = 1; month <= 12; month++)
                        writer.WriteLine(year + "\t" + month + "\t" + data[year][month]);
                }

                writer.Close();
            } catch (FileNotFoundException e) {
                Console.WriteLine(e);
            } catch (Exception e) {
                Console.WriteLine(e);
            }
        }
    }
}
