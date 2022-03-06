const addPlugin = (shaka) => {
  shaka.net.HttpPluginUtils = class {
    static makeResponse(headers, data, status, uri, responseURL, requestType) {
      if (status >= 200 && status <= 299 && status !== 202) {
        // Most 2xx HTTP codes are success cases.
        return {
          uri: responseURL || uri,
          originalUri: uri,
          data: data,
          status: status,
          headers: headers,
          fromCache: !!headers["x-shaka-from-cache"],
        }
      } else {
        let responseText = null
        try {
          responseText = shaka.util.StringUtils.fromBytesAutoDetect(data)
        } catch (exception) {
          shaka.log.debug("HTTP error text:", responseText)

          const severity =
            status === 401 || status === 403
              ? shaka.util.Error.Severity.CRITICAL
              : shaka.util.Error.Severity.RECOVERABLE

          throw new shaka.util.Error(
            severity,
            shaka.util.Error.Category.NETWORK,
            shaka.util.Error.Code.BAD_HTTP_STATUS,
            uri,
            status,
            responseText,
            headers,
            requestType
          )
        }
      }
    }
  }

  /**
   * @summary A networking plugin to handle IPFS
   * @export
   */
  shaka.net.ipfsPlugin = class {
    static parse(uri, request, requestType, progressUpdated, headersReceived) {
      //console.log('⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐️️️️', [uri, request, requestType, progressUpdated, headersReceived])

      const headers = new shaka.net.ipfsPlugin.Headers_()
      /*shaka.util.MapUtils.asMap(request.headers).forEach((value, key) => {
        headers.append(key, value);
      });*/
      for (const [key, value] of Object.entries(request.headers)) {
        headers.append(key, value)
      }

      const controller = new shaka.net.ipfsPlugin.AbortController_()

      /** @type {!RequestInit} */
      const init = {
        // Edge does not treat null as undefined for body; https://bit.ly/2luyE6x
        body: request.body || undefined,
        headers: headers,
        method: request.method,
        signal: controller.signal,
        credentials: request.allowCrossSiteCredentials ? "include" : undefined,
      }

      /** @type {shaka.net.ipfsPlugin.AbortStatus} */
      const abortStatus = {
        canceled: false,
        timedOut: false,
      }

      const pendingRequest = shaka.net.ipfsPlugin.request_(
        uri,
        requestType,
        init,
        abortStatus,
        progressUpdated,
        headersReceived,
        request.streamDataCallback
      )
      //console.log('--------pendingRequest', pendingRequest, [uri, requestType, init, abortStatus, progressUpdated, headersReceived, request.streamDataCallback])

      const op = new shaka.util.AbortableOperation(pendingRequest, () => {
        console.debug("Aborted request", uri)
        abortStatus.canceled = true
        controller.abort()
        return Promise.resolve()
      })

      // The fetch API does not timeout natively, so do a timeout manually using
      // the AbortController.
      const timeoutMs = request.retryParameters.timeout

      if (timeoutMs) {
        const timer = new shaka.util.Timer(() => {
          abortStatus.timedOut = true
          controller.abort()
        })

        timer.tickAfter(timeoutMs / 1000)

        // To avoid calling |abort| on the network request after it finished, we
        // will stop the timer when the requests resolves/rejects.
        op.finally(() => {
          timer.stop()
        })
      }

      return op
    }

    /**
     * @private
     */
    static async request_(
      uri,
      requestType,
      init,
      abortStatus,
      progressUpdated,
      headersReceived,
      // eslint-disable-next-line no-unused-vars
      streamDataCallback
    ) {
      let response = new Response()

      try {
        // The promise returned by fetch resolves as soon as the HTTP response
        // headers are available. The download itself isn't done until the promise
        // for retrieving the data (arrayBuffer, blob, etc) has resolved.
        //response = await fetch(uri, init);

        const cid = "/ipfs/" + uri.split(":").slice(1).join(":").slice(2)

        // get data from ipfs
        const stats = await window.node.files.stat(cid)

        // get content type
        const contentType = this.GetContentType(cid)

        // get content length
        const contentLength = stats.size

        response.headers.append("Content-Type", contentType)
        response.headers.append("Content-Length", contentLength)

        // At this point in the process, we have the headers of the response, but
        // not the body yet.
        headersReceived(
          shaka.net.ipfsPlugin.headersToGenericObject_(response.headers)
        )

        const iter = await window.node.cat(cid)
        const S = await this.getStream(iter, contentLength, progressUpdated)
        const stream = await S.arrayBuffer()
        const headers = shaka.net.ipfsPlugin.headersToGenericObject_(
          response.headers
        )

        return shaka.net.HttpPluginUtils.makeResponse(
          headers,
          stream,
          response.status,
          uri,
          response.url,
          requestType
        )
      } catch (error) {
        if (abortStatus.canceled) {
          throw new shaka.util.Error(
            shaka.util.Error.Severity.RECOVERABLE,
            shaka.util.Error.Category.NETWORK,
            shaka.util.Error.Code.OPERATION_ABORTED,
            uri,
            requestType
          )
        } else if (abortStatus.timedOut) {
          throw new shaka.util.Error(
            shaka.util.Error.Severity.RECOVERABLE,
            shaka.util.Error.Category.NETWORK,
            shaka.util.Error.Code.TIMEOUT,
            uri,
            requestType
          )
        } else {
          throw new shaka.util.Error(
            shaka.util.Error.Severity.RECOVERABLE,
            shaka.util.Error.Category.NETWORK,
            shaka.util.Error.Code.HTTP_ERROR,
            uri,
            error,
            requestType
          )
        }
      }
    }

    /**
     * @param {!Headers} headers
     * @return {!Object.<string, string>}
     * @private
     */
    static headersToGenericObject_(headers) {
      const headersObj = {}
      headers.forEach((value, key) => {
        // Since Edge incorrectly return the header with a leading new line
        // character ('\n'), we trim the header here.
        headersObj[key.trim()] = value
      })
      return headersObj
    }

    /**
     * Determine if the Fetch API is supported in the browser. Note: this is
     * deliberately exposed as a method to allow the client app to use the same
     * logic as Shaka when determining support.
     * @return {boolean}
     * @export
     */
    static isSupported() {
      // On Edge, ReadableStream exists, but attempting to construct it results in
      // an error. See https://bit.ly/2zwaFLL
      // So this has to check that ReadableStream is present AND usable.
      if (window.ReadableStream) {
        try {
          new ReadableStream({}) // eslint-disable-line no-new
        } catch (e) {
          return false
        }
      } else {
        return false
      }
      return !!(window.fetch && window.AbortController)
    }

    static GetContentType = (uri) => {
      // get uri extension
      const parts = uri.split(".")
      const extension = parts[parts.length - 1]
      switch (extension) {
        case "mpd":
          return "application/dash+xml"
        case "m3u8":
          return "application/x-mpegURL"
        case "m4s":
          return "video/iso.segment"
        case "jpg":
          return "image/jpeg"
        case "png":
          return "image/png"
        case "mp4":
          return "video/mp4"
        case "webm":
          return "video/webm"
        case "mp3":
          return "audio/mp3"
        case "ogg":
          return "audio/ogg"
        default:
          return "application/octet-stream"
      }
    }

    // return ReadableStream form ipfs iterable
    static getStream = (iter, contentLength, progressUpdated) => {
      let loaded = 0
      let lastLoaded = 0
      let lastTime = Date.now()

      return Promise.resolve()
        .then(() => {
          return new ReadableStream({
            start(controller) {
              // The following function handles each data chunk
              function push() {
                // "done" is a Boolean and value a "Uint8Array"
                iter.next().then(({ done, value }) => {
                  // If there is no more data to read
                  if (done) {
                    controller.close()
                    return
                  }
                  // Get the data and send it to the browser via the controller
                  controller.enqueue(value)
                  // Check chunks by logging
                  //console.log(done, value);
                  push()

                  const currentTime = Date.now()
                  // If the time between last time and this time we got progress event
                  // is long enough, or if a whole segment is downloaded, call
                  // progressUpdated().
                  if (currentTime - lastTime > 100 || done) {
                    progressUpdated(
                      currentTime - lastTime,
                      loaded - lastLoaded,
                      contentLength - loaded
                    )
                    lastLoaded = loaded
                    lastTime = currentTime
                  }
                })
              }
              push()
            },
          })
        })
        .then((stream) => {
          return new Response(stream)
        })
    }
  }

  /**
   * @typedef {{
   *   canceled: boolean,
   *   timedOut: boolean
   * }}
   * @property {boolean} canceled
   *   Indicates if the request was canceled.
   * @property {boolean} timedOut
   *   Indicates if the request timed out.
   */
  shaka.net.ipfsPlugin.AbortStatus

  /**
   * Overridden in unit tests, but compiled out in production.
   *
   * @const {function(string, !RequestInit)}
   * @private
   */
  //shaka.net.ipfsPlugin.fetch_ = window.fetch;

  /**
   * Overridden in unit tests, but compiled out in production.
   *
   * @const {function(new: AbortController)}
   * @private
   */
  shaka.net.ipfsPlugin.AbortController_ = window.AbortController

  /**
   * Overridden in unit tests, but compiled out in production.
   *
   * @const {function(new: ReadableStream, !Object)}
   * @private
   */
  shaka.net.ipfsPlugin.ReadableStream_ = window.ReadableStream

  /**
   * Overridden in unit tests, but compiled out in production.
   *
   * @const {function(new: Headers)}
   * @private
   */
  shaka.net.ipfsPlugin.Headers_ = window.Headers

  if (shaka.net.ipfsPlugin.isSupported()) {
    shaka.net.NetworkingEngine.registerScheme(
      "ipfs",
      shaka.net.ipfsPlugin.parse,
      shaka.net.NetworkingEngine.PluginPriority.PREFERRED,
      /* progressSupport= */ true
    )
  }
}

export default addPlugin
