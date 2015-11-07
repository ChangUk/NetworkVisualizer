using System;
using System.Collections.Generic;
using System.Data.SQLite;

namespace NetworkVisualizer {
    public class SQLiteAdapter {
        private SQLiteConnection conn = null;

        public SQLiteAdapter(string dbPath) {
            try {
                SQLiteConnectionStringBuilder connBuilder = new SQLiteConnectionStringBuilder();
                connBuilder.DataSource = dbPath;
                connBuilder.Version = 3;
                connBuilder.JournalMode = SQLiteJournalModeEnum.Wal;
                this.conn = new SQLiteConnection(connBuilder.ToString());
                this.conn.Open();
            } catch (Exception e) {
                throw e;
            }
        }

        public void closeDB() {
            if (conn != null)
                conn.Close();
        }

        public HashSet<string> getFollowingUsers(string userId) {
            HashSet<string> userList = new HashSet<string>();
            using (SQLiteCommand cmd = new SQLiteCommand(conn)) {
                cmd.CommandText = "SELECT target FROM follow WHERE source = " + userId;
                using (SQLiteDataReader reader = cmd.ExecuteReader()) {
                    while (reader.Read()) {
                        string followee = reader.GetValue(0).ToString();
                        userList.Add(followee);
                    }
                }
            }
            return userList;
        }

        public HashSet<long> getAuthorship(long userId) {
            HashSet<long> tweetList = new HashSet<long>();
            using (SQLiteCommand cmd = new SQLiteCommand(conn)) {
                cmd.CommandText = "SELECT id FROM tweet WHERE author = " + userId;
                using (SQLiteDataReader reader = cmd.ExecuteReader()) {
                    while (reader.Read()) {
                        long tweet = (long)reader.GetValue(0);
                        tweetList.Add(tweet);
                    }
                }
            }
            return tweetList;
        }

        public HashSet<long> getRetweets(long userId) {
            HashSet<long> tweetList = new HashSet<long>();
            using (SQLiteCommand cmd = new SQLiteCommand(conn)) {
                cmd.CommandText = "SELECT tweet FROM retweet WHERE user = " + userId;
                using (SQLiteDataReader reader = cmd.ExecuteReader()) {
                    while (reader.Read()) {
                        long tweet = (long)reader.GetValue(0);
                        tweetList.Add(tweet);
                    }
                }
            }
            return tweetList;
        }

        public HashSet<long> getQuotedTweets(long userId) {
            HashSet<long> tweetList = new HashSet<long>();
            using (SQLiteCommand cmd = new SQLiteCommand(conn)) {
                cmd.CommandText = "SELECT tweet FROM quote WHERE user = " + userId;
                using (SQLiteDataReader reader = cmd.ExecuteReader()) {
                    while (reader.Read()) {
                        long tweet = (long)reader.GetValue(0);
                        tweetList.Add(tweet);
                    }
                }
            }
            return tweetList;
        }

        public HashSet<long> getFavoriteTweets(long userId) {
            HashSet<long> tweetList = new HashSet<long>();
            using (SQLiteCommand cmd = new SQLiteCommand(conn)) {
                cmd.CommandText = "SELECT tweet FROM favorite WHERE user = " + userId;
                using (SQLiteDataReader reader = cmd.ExecuteReader()) {
                    while (reader.Read()) {
                        long tweet = (long)reader.GetValue(0);
                        tweetList.Add(tweet);
                    }
                }
            }
            return tweetList;
        }

        public Dictionary<long, int> getMentionCounts(long userId) {
            Dictionary<long, int> mentionCounts = new Dictionary<long, int>();
            using (SQLiteCommand cmd = new SQLiteCommand(conn)) {
                cmd.CommandText = "SELECT target FROM mention WHERE source = " + userId;
                using (SQLiteDataReader reader = cmd.ExecuteReader()) {
                    while (reader.Read()) {
                        long target = (long)reader.GetValue(0);
                        if (!mentionCounts.ContainsKey(target))
                            mentionCounts.Add(target, 1);
                        else
                            mentionCounts[target] += 1;
                    }
                }
            }
            return mentionCounts;
        }

        public int getMentionCount(string userId1, string userId2) {
            int mentionCount = 0;
            using (SQLiteCommand cmd = new SQLiteCommand(conn)) {
                cmd.CommandText = "SELECT COUNT(*) FROM mention WHERE source = " + userId1 + " AND target = " + userId2;
                Int64 count = (Int64)cmd.ExecuteScalar();
                mentionCount += (int)count;
                cmd.CommandText = "SELECT COUNT(*) FROM mention WHERE source = " + userId2 + " AND target = " + userId1;
                count = (Int64)cmd.ExecuteScalar();
                mentionCount += (int)count;
            }
            return mentionCount;
        }
    }
}
