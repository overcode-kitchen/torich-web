#!/bin/sh
# 실기기 테스트용 맥의 LAN IP를 출력한다.
#
# en0을 직접 조회하지 않는 이유: 맥·독·USB 이더넷 구성에 따라 Wi-Fi가 en0이 아닐 수 있고,
# 그런 환경에서 en0은 빈 값이거나 169.254.x.x(link-local)를 돌려줘 아이폰이 접속하지 못한다.
# 기본 라우트가 실제로 나가는 인터페이스를 물어보는 쪽이 어떤 구성에서도 맞다.
iface=$(route -n get default 2>/dev/null | awk '/interface:/{print $2}')
ip=$(ipconfig getifaddr "$iface" 2>/dev/null)

if [ -z "$ip" ]; then
  echo "LAN IP를 찾지 못했습니다. Wi-Fi에 연결되어 있는지 확인하세요." >&2
  exit 1
fi

echo "$ip"
