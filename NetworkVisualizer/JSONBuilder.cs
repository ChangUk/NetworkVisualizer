using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;

namespace NetworkVisualizer {
    public class JSONBuilder {
        private string filename;

        public JSONBuilder(string filename) {
            this.filename = filename;
        }

        public void run() {
            Console.WriteLine("Making network files of JSON format...");
            string egoUser = Path.GetFileNameWithoutExtension(filename);
            Console.WriteLine(egoUser);

            try {
                // To handle the exception while the program runs
                if (!File.Exists(filename))
                    throw new FileNotFoundException(filename);

                // Get DB connection
                SQLiteAdapter dbAdapter = new SQLiteAdapter(filename);

                // Get nodes
                int nNodes = 0;
                Dictionary<string, int> users = new Dictionary<string, int>();
                users.Add(egoUser, nNodes++);
                HashSet<string> followingUsers = dbAdapter.getFollowingUsers(egoUser);
                foreach (string followingUser in followingUsers) {
                    HashSet<string> followingUsersOfFollowingUser = dbAdapter.getFollowingUsers(followingUser);
                    if (followingUsersOfFollowingUser.Contains(egoUser))
                        users.Add(followingUser, nNodes++);
                }

                // Make users' index map to find user id by index
                Dictionary<int, string> indexMap = new Dictionary<int, string>();
                foreach (string userId in users.Keys)
                    indexMap.Add(users[userId], userId);

                // Get edges (undirected)
                HashSet<string> visited = new HashSet<string>();
                Dictionary<string, HashSet<string>> undirectedEdges = new Dictionary<string, HashSet<string>>();
                Dictionary<string, int> linkCount = new Dictionary<string, int>();
                foreach (string source in users.Keys) {
                    HashSet<string> allTargets = dbAdapter.getFollowingUsers(source);
                    HashSet<string> targets = new HashSet<string>();
                    foreach (string target in allTargets) {
                        if (!users.ContainsKey(target))
                            continue;
                        if (visited.Contains(target))
                            continue;

                        targets.Add(target);

                        // Count the number of links of the node
                        if (!linkCount.ContainsKey(source))
                            linkCount.Add(source, 0);
                        linkCount[source] += 1;
                        if (!linkCount.ContainsKey(target))
                            linkCount.Add(target, 0);
                        linkCount[target] += 1;
                    }

                    undirectedEdges.Add(source, targets);   // Save edges from source node(user)
                    visited.Add(source);                    // Set visited node
                }

                // Make *.pairs files
                string curDir = System.Environment.CurrentDirectory;
                string dirFastModularity = curDir + Path.DirectorySeparatorChar + "FastModularity" + Path.DirectorySeparatorChar;
                string dirByProducts = dirFastModularity + "clusters" + Path.DirectorySeparatorChar;
                if (!Directory.Exists(dirByProducts))
                    Directory.CreateDirectory(dirByProducts);
                string file_pairs = dirFastModularity + egoUser + ".pairs";         // *.pairs
                StreamWriter pairsFileMaker = new StreamWriter(file_pairs);
                foreach (string source in undirectedEdges.Keys) {
                    foreach (string target in undirectedEdges[source])
                        pairsFileMaker.Write(users[source] + "\t" + users[target] + "\n");
                }
                pairsFileMaker.Close();

                // Run graph clustering using external c++ program
                ProcessStartInfo fastModularity = new ProcessStartInfo();
                fastModularity.FileName = dirFastModularity + "FastModularity.exe";
                fastModularity.Arguments = "-f \"" + file_pairs + "\"";
                fastModularity.WindowStyle = ProcessWindowStyle.Hidden;
                fastModularity.CreateNoWindow = true;
                using (Process proc = Process.Start(fastModularity)) {
                    proc.WaitForExit();
                }

                // Load cluster information from a by-product file which is produced during the graph clustering
                Dictionary<string, int> groupNumbers = new Dictionary<string, int>();
                int groupNumber = 1;
                StreamReader reader = new StreamReader(dirByProducts + egoUser);
                string line;
                while ((line = reader.ReadLine()) != null) {
                    string[] userIndices = line.Split('\t');
                    foreach (string indUser in userIndices) {
                        if (indUser.Length == 0)
                            continue;

                        int userIndex = int.Parse(indUser);
                        if (userIndex == 0) {
                            groupNumbers.Add(egoUser, 0);
                        } else {
                            string userId = indexMap[userIndex];
                            groupNumbers.Add(userId, groupNumber);
                        }
                    }
                    groupNumber += 1;
                }
                reader.Close();

                // Write node information
                string dirData = Directory.GetParent(filename).ToString() + Path.DirectorySeparatorChar;
                StreamWriter writer = new StreamWriter(dirData + egoUser + ".json");    // Output file
                writer.WriteLine("{\r\n\t\"nodes\": [");
                bool isFirstRecord = true;
                foreach (string userId in users.Keys) {
                    int cluster = groupNumbers[userId];
                    if (linkCount[userId] == 1)     // Set the group number of leaf node as -1
                        cluster = -1;

                    if (isFirstRecord) {
                        writer.Write("\t\t{\"name\":\"" + userId + "\",\"group\":" + cluster + "}");
                        isFirstRecord = false;
                    } else {
                        writer.Write(",\r\n\t\t{\"name\":\"" + userId + "\",\"group\":" + cluster + "}");
                    }
                }

                // Write link information
                writer.WriteLine("\r\n\t], \"links\": [");
                isFirstRecord = true;
                foreach (string source in undirectedEdges.Keys) {
                    foreach (string target in undirectedEdges[source]) {
                        int mentionCount = (int)dbAdapter.getMentionCount(source, target);
                        if (mentionCount > 0)
                            mentionCount = (int)Math.Log(mentionCount);
                        mentionCount += 1;
                        if (isFirstRecord) {
                            writer.Write("\t\t{\"source\":" + users[source] + ",\"target\":" + users[target] + ",\"value\":" + mentionCount + "}");
                            isFirstRecord = false;
                        } else {
                            writer.Write(",\r\n\t\t{\"source\":" + users[source] + ",\"target\":" + users[target] + ",\"value\":" + mentionCount + "}");
                        }
                    }
                }
                writer.WriteLine("\r\n\t]\r\n}");
                writer.Close();
                
                // Close database connection
                dbAdapter.closeDB();

                // Delete the by-product files
                File.Delete(file_pairs);
                File.Delete(dirByProducts + egoUser);
                Directory.Delete(dirByProducts);
            } catch (FileNotFoundException e) {
                Console.WriteLine(e);
            } catch (Exception e) {
                Console.WriteLine(e);
            }
        }
    }
}
