# NetworkVisualizer
Network Visualization using `d3.js`.

## Environment & Prerequisite
* OS: Windows
* Nuget package install: System.Data.SQLite

## Usage
### Build JSON network data from SQLite DB files
After the solution build, the `NetworkVisualizer.exe` will be generated.
And then, run the `NetworkVisualizer.exe` under the file structure as follows:
```
bin
├── Release (or Debug)
│   ├── FastModularity
│   │   └── FastModularity.exe
│   ├── NetworkVisualizer.exe
│   ├── System.Data.SQLite.dll
:   :
```
Executing command line:
```sh
C:\GitHub\NetworkVisualizer\NetworkVisualizer\bin\Release> NetworkVisualizer.exe C:\data_directory\ (enter)
```

### Move JSON network files
After running the JSON builder program,
the *.json network files are generated at the directory which contains original data files(*.sqlite).
After that, you should move the json files to the sub-directory named 'data'.
It is because that the visulization javascript code cannot access other system path due to the security issue.<br />
The file structure is as follows:
```
Visualizer
├── css
│   └── style.css
├── data
│   ├── 1122334455.json
│   ├── 123456789.json
│   ├── 10203040506.json
│   :
│
├── js
│   ├── d3.v3.min.js
│   └── visualizer.js
└── index.html
```
JSON file format:
```
{
    "nodes": [
        {"name":"1122334455", "group":0},
        {"name":"123123123", "group":3},
        ...
        {"name":"2121212121", "group":1}
    ],
    "links": [
        {"source":0, "target":1, "value":2},
        {"source":0, "target":4, "value":1},
        ...
        {"source":6, "target":11, "value":1}
    ]
}
```

### Run network visualizer
Execute `index.html` and select one of json files in the data directory.
