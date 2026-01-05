# MediaPeek

Instantly analyze media files.

![MediaPeek Demo](public/app.png)

MediaPeek provides detailed technical metadata for video, audio, image, and subtitle files directly in your browser. It processes URLs intelligently—fetching only the necessary data segments—so you don't need to download the whole file.

The tool operates on Cloudflare Workers using MediaInfo.js to perform analysis at the edge. Server-Side Request Forgery (SSRF) protection prevents access to unauthorized local or private network resources. Analysis results can be shared securely using the integrated PrivateBin feature.

## Formats

MediaPeek supports the following output formats:

- Text
- HTML
- XML
- JSON

## Try it with these examples

You can use the following URLs to test the application:

- https://media.w3.org/2010/05/sintel/trailer.mp4
- https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4
- https://opencontent.netflix.com/
- https://www.peterpee.com/demo
- https://drive.google.com/drive/folders/1JxmeedtAtgmoafXv9rroiDOS2vEX7N4b
- https://www2.iis.fraunhofer.de/AAC/index.html
- https://1drv.ms/f/c/999a020cf5718098/EobEBJqZ92ZFipImX5WugTUB7xX5r5ko-omYcTJQ9chLPA
- https://ott.dolby.com/OnDelKits/AC-4/Dolby_AC-4_Online_Delivery_Kit_1.5/help_files/topics/kit_wrapper_MP4_multiplexed_streams.html
- https://lf-tk-sg.ibytedtos.com/obj/tcs-client-sg/resources/video_demo_hevc.html
- https://kodi.wiki/view/Samples

## License

GNU GPLv3
