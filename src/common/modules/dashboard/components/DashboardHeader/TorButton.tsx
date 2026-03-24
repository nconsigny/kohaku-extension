import React, { useCallback, useEffect, useState } from 'react'
import { View } from 'react-native'

import TorIcon from '@common/assets/svg/TorIcon'
import Spinner from '@common/components/Spinner'
import Text from '@common/components/Text'
import Tooltip from '@common/components/Tooltip'
import useTheme from '@common/hooks/useTheme'
import common from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'
import useBackgroundService from '@web/hooks/useBackgroundService'
import { AnimatedPressable, useCustomHover } from '@web/hooks/useHover'
import eventBus from '@web/extension-services/event/eventBus'

const TorButton = () => {
  const { theme } = useTheme()
  const { dispatch } = useBackgroundService()
  const [torEnabled, setTorEnabled] = useState(false)
  const [torStatus, setTorStatus] = useState<string>('disconnected')

  const [bindAnim, animStyle] = useCustomHover({
    property: 'opacity',
    values: { from: 1, to: 0.7 }
  })

  useEffect(() => {
    dispatch({ type: 'TOR_GET_STATUS' })

    const handler = (state: { enabled: boolean; status: string }) => {
      setTorEnabled(state.enabled)
      setTorStatus(state.status)
    }
    eventBus.addEventListener('torStatus', handler)
    return () => eventBus.removeEventListener('torStatus', handler)
  }, [dispatch])

  const handlePress = useCallback(() => {
    const newEnabled = !torEnabled
    setTorEnabled(newEnabled)
    if (newEnabled) setTorStatus('connecting')
    dispatch({ type: 'TOR_SET_ENABLED', params: { enabled: newEnabled } })
  }, [torEnabled, dispatch])

  const iconColor = torEnabled
    ? torStatus === 'connected'
      ? '#4CAF50'
      : theme.warningText
    : theme.secondaryText

  const labelColor = torEnabled
    ? torStatus === 'connected'
      ? '#4CAF50'
      : theme.warningText
    : theme.secondaryText

  const tooltipText = torEnabled
    ? torStatus === 'connected'
      ? 'Tor: Connected - all traffic routed through Tor'
      : 'Tor: Building circuit...'
    : 'Click to route all traffic through Tor'

  return (
    // @ts-ignore
    <View dataSet={{ tooltipId: 'tor-button' }}>
      <AnimatedPressable
        onPress={handlePress}
        disabled={torStatus === 'connecting'}
        style={{
          ...flexbox.center,
          ...common.borderRadiusPrimary,
          ...animStyle,
          paddingHorizontal: 6,
          paddingVertical: 4
        }}
        {...bindAnim}
      >
        {torStatus === 'connecting' ? (
          <Spinner style={{ width: 20, height: 20 }} />
        ) : (
          <TorIcon width={20} height={20} color={iconColor} />
        )}
        <Text
          fontSize={9}
          weight="medium"
          color={labelColor}
          style={{ marginTop: 1 }}
        >
          Tor
        </Text>
      </AnimatedPressable>
      <Tooltip content={tooltipText} id="tor-button" />
    </View>
  )
}

export default React.memo(TorButton)
