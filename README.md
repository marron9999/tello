# Tello server

使った node: v19.4.0 (x64)

1) リポジトリをclone

2) ffmpeg（ffmpeg-master-latest-win64-gpl.zip）をダウンロードし、
　zip内のexeをカレントに配置

　　私が入手した先: https://github.com/BtbN/FFmpeg-Builds/releases

3) npm install で必要なパッケージをインストール

4) telloのWi-Fiに接続

5) node index.js で起動

6) http://localhost:8080/index.html を開く

　　→　正常ならば、ステータスが変化します

7) connectボタンを押す

　　→　connect後ならば、
　　　　Stream onでtelloのカメラ映像は映ります

8) Take Offボタンを押す

9) W A D S ↑↓←→ のキーを押す毎に、
　telloが少し動きます
　（押し続けても継続して動きません）

10) Auto landで着陸

11) Disconnectで切り離し



