#!/usr/bin/env python
import tornado.ioloop
import tornado.web
import mpd
import json
import urllib.request
import urllib.parse
import lxml.html
import re

MUSIC_PATH = "/home/leonard/Musik/"

class ArtistHandler(tornado.web.RequestHandler):
	def get(self):
		self.write(json.dumps(mpd.list("artist")))

class AlbumHandler(tornado.web.RequestHandler):
	def get(self):
		artist = self.get_argument("n")
		self.write(json.dumps(mpd.list('album', 'artist', artist)))

class TitleHandler(tornado.web.RequestHandler):
	def get(self):
		n = self.get_argument("n")
		a = self.get_argument("a")

		self.write(json.dumps(mpd.find('artist', n, 'album', a)))

class ArtistArtHandler(tornado.web.RequestHandler):
	def get(self):
		artist = self.get_argument("n")

		if artist in ArtistArtCache:
			self.redirect(ArtistArtCache[artist])
		else:
			try:
				req = urllib.request.Request(url="http://www.last.fm/music/{0}".format(urllib.request.pathname2url(artist)))
				req.add_header("User-Agent", "Mozilla/5.0")
				f = urllib.request.urlopen(req)
				doc = lxml.html.document_fromstring(f.read().decode("utf-8"))
				doc = doc.find_class("hero-image")[0].attrib['style']
				url = re.findall(r"url\(([^\)]*)\)", doc)[0]
				ArtistArtCache[artist] = url
				self.redirect(url)
			except:
				self.redirect("http://img.schredder.me/200x200")

class AlbumArtHandler(tornado.web.RequestHandler):
	def get(self):
		artist = self.get_argument("n")
		album = self.get_argument("a")

		if artist+album in AlbumArtCache:
			self.redirect(AlbumArtCache[artist+album])
		else:
			try:
				req = urllib.request.Request(url="http://www.last.fm/music/{0}/{1}".format(
					urllib.request.pathname2url(artist),
					urllib.request.pathname2url(album)
				))
				req.add_header("User-Agent", "Mozilla/5.0")
				f = urllib.request.urlopen(req)
				doc = lxml.html.document_fromstring(f.read().decode("utf-8"))
				url = doc.find_class("album-cover")[0].attrib["src"]
				AlbumArtCache[artist+album] = url
				self.redirect(url)
			except:
				self.redirect("http://img.schredder.me/200x200")

class PlaylistHandler(tornado.web.RequestHandler):
	def get(self):
		pl = self.get_arguments("pl")
		if len(pl) > 0:
			self.write(json.dumps(mpd.listplaylist(pl[0])))

		self.write(json.dumps(mpd.listplaylists()))

ArtistArtCache = {}
AlbumArtCache = {}
mpd = mpd.MPDClient()
application = tornado.web.Application([
	(r"/artist", ArtistHandler),
	(r"/artistArt", ArtistArtHandler),
	(r"/albums", AlbumHandler),
	(r"/albumArt", AlbumArtHandler),
	(r"/albums/title", TitleHandler),
	(r"/playlist", PlaylistHandler),
	(r"/", tornado.web.RedirectHandler, {"url": "/index.html"}),
	(r"/music/(.*)", tornado.web.StaticFileHandler, {"path": MUSIC_PATH}),
	(r"/(.*)", tornado.web.StaticFileHandler, {"path": "static/"})
])

if __name__ == "__main__":
	mpd.connect("localhost", 6600)
	application.listen(8888)
	tornado.ioloop.IOLoop.instance().start()