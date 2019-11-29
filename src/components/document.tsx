



import React from 'react'



interface Props {
	html: string
}


export default (props: Props) => (
	<div
		style={{ background: 'thistle', padding: '1.45em', margin: '1.45rem 0' }}
		dangerouslySetInnerHTML={{ __html: props.html }}
	/>
)


