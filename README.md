# MediaPeek

<p align="center">
  <img src="resources/app_icons/MediaPeek-Dark-Default-1024x1024@1x.png" width="200" alt="MediaPeek Icon">
</p>

> Get detailed metadata for any media file.

MediaPeek provides detailed technical metadata for video, audio, image, and subtitle files directly in your browser. It processes URLs intelligently—fetching only the necessary data segments—so you don't need to download the whole file.

![MediaPeek Demo](public/app.png)

The tool operates on Cloudflare Workers using MediaInfo.js to perform analysis at the edge. Server-Side Request Forgery (SSRF) protection prevents access to unauthorized local or private network resources. Analysis results can be shared securely using the integrated PrivateBin feature.

## Formats

MediaPeek supports the following output formats:

- Object
- JSON
- Text
- HTML
- XML

## Supported Links

MediaPeek analyzes content from:

- **Web Servers**: Standard HTTP and HTTPS URLs. Optimized for servers supporting byte-range requests.
- **Google Drive**: Public files and folders.

## Try It

You can use the following URLs to test the application:

### Direct Links

- [Sintel Trailer](https://media.w3.org/2010/05/sintel/trailer.mp4)
- [ForBiggerBlazes Clip](https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4)

### Collections

- [4K-8K Dolby Vision Samples & Test Clips by Salty01](https://drive.google.com/drive/folders/1yAq-jgsb8pYa92PnGZkxyEV0E3VVkhiC)
- [Netflix Open Content](https://opencontent.netflix.com/)
- [Dolby AC-4 Online Delivery Kit](https://ott.dolby.com/OnDelKits/AC-4/Dolby_AC-4_Online_Delivery_Kit_1.5/help_files/topics/kit_wrapper_MP4_multiplexed_streams.html)
- [AAC Audioss by Fraunhofer](https://www2.iis.fraunhofer.de/AAC/index.html)
- [Kodi](https://kodi.wiki/view/Samples)
- [Jellyfin Test Videos](https://repo.jellyfin.org/test-videos/)
- [PeterPee Atmos](https://www.peterpee.com/demo)
- [HEVC Videos](https://lf-tk-sg.ibytedtos.com/obj/tcs-client-sg/resources/video_demo_hevc.html)
- [Surround sound by Buzz*Buzz_Buzz*](https://drive.google.com/drive/folders/1JxmeedtAtgmoafXv9rroiDOS2vEX7N4b)
- [Demos Dolby Vision, Atmos, DTS-X, 4K UHD and Video Games by unknown](https://1drv.ms/f/c/999a020cf5718098/EobEBJqZ92ZFipImX5WugTUB7xX5r5ko-omYcTJQ9chLPA)

## License

**MediaPeek** is released under the GNU GPLv3.

### Acknowledgments

- **MediaInfo**: Copyright © 2002–2023 MediaArea.net SARL. Analysis is powered by [mediainfo.js](https://github.com/buzz/mediainfo.js), a WebAssembly port of [MediaInfoLib](https://github.com/MediaArea/MediaInfoLib). ([License](https://mediaarea.net/en/MediaInfo/License))

- **PrivateBin**: Enables secure sharing of results. ([License](https://github.com/PrivateBin/PrivateBin/blob/master/LICENSE.md))

- **Apple TV+ Badges**: The format badges (Dolby, Immersive, 3D, HD, 4K, HDR, HDR10+) are sourced from [Apple TV+](https://tv.apple.com/). We selected these designs for their visual perfection and clarity, which align seamlessly with MediaPeek's aesthetic.

- **Cloudflare Workers**: Hosted on [Cloudflare Workers](https://workers.cloudflare.com/). We appreciate their generous free tier which makes this project possible.
