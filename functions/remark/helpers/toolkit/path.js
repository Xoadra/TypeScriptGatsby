



const os = require('os')
const path = require('path')



const joinPath = (...paths) => {
	const joinedPath = path.join(...paths)
	if (os.platform() === 'win32') {
		return joinedPath.replace(/\\/g, '\\\\')
	}
	return joinedPath
}


const posixJoinWithLeadingSlash = paths => (
	path.posix.join(
		...paths.map((segment, index) => segment === '' && index === 0 ? '/' : segment)
	)
)


const withBasePath = (basePath) => (...paths) => joinPath(basePath, ...paths)


const withTrailingSlash = (basePath) => `${basePath}/`


const getCommonDir = (path1, path2) => {
	const path1Segments = path1.split(/[/\\]/)
	const path2Segments = path2.split(/[/\\]/)
	for (let i = 0; i < path1Segments.length; i++) {
		if (i >= path2Segments.length) {
			return posixJoinWithLeadingSlash(path2Segments)
		} else if (
			path1Segments[i].toLowerCase() !== path2Segments[i].toLowerCase()
		) {
			const joined = path1Segments.slice(0, i)
			return posixJoinWithLeadingSlash(joined)
		}
	}
	return posixJoinWithLeadingSlash(path1Segments)
}


module.exports = { withBasePath, withTrailingSlash, getCommonDir }


