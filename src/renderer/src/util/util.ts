const SUPPORT_URL = 'https://114.unipost.co.kr/home.uni'

export async function openUniPost(srIdx: string) {
  try {
    const url = `${SUPPORT_URL}?access=list&srIdx=${srIdx}`
    await window.api.openExternal(url)
  } catch (error) {
    console.error('[TaskTable] 외부 URL 열기 실패:', error)
  }
}

const ENG_KEY = 'rRseEfaqQtTdwWczxvgkoiOjpuPhynbml'
const KOR_KEY = 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎㅏㅐㅑㅒㅓㅔㅕㅖㅗㅛㅜㅠㅡㅣ'
const CHO_DATA = 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ'
const JUNG_DATA = 'ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ'
const JONG_DATA = 'ㄱㄲㄳㄴㄵㄶㄷㄹㄺㄻㄼㄽㄾㄿㅀㅁㅂㅄㅅㅆㅇㅈㅊㅋㅌㅍㅎ'

export const engTypeToKor = (src: string): string => {
  let res = ''
  if (src.length === 0) return res

  let nCho = -1,
    nJung = -1,
    nJong = -1 // 초성, 중성, 종성

  for (let i = 0; i < src.length; i++) {
    const ch = src.charAt(i)
    const p = ENG_KEY.indexOf(ch)

    if (p === -1) {
      if (nCho !== -1) {
        if (nJung !== -1) {
          res += makeHangul(nCho, nJung, nJong)
        } else {
          res += CHO_DATA.charAt(nCho)
        }
      } else {
        if (nJung !== -1) {
          res += JUNG_DATA.charAt(nJung)
        } else if (nJong !== -1) {
          res += JONG_DATA.charAt(nJong)
        }
      }
      nCho = -1
      nJung = -1
      nJong = -1
      res += ch
    } else if (p < 19) {
      // 자음
      if (nJung !== -1) {
        if (nCho === -1) {
          res += JUNG_DATA.charAt(nJung)
          nJung = -1
          nCho = CHO_DATA.indexOf(KOR_KEY.charAt(p))
        } else {
          if (nJong === -1) {
            nJong = JONG_DATA.indexOf(KOR_KEY.charAt(p))
            if (nJong === -1) {
              res += makeHangul(nCho, nJung, nJong)
              nCho = CHO_DATA.indexOf(KOR_KEY.charAt(p))
              nJung = -1
            }
          } else if (nJong === 0 && p === 9) {
            nJong = 2
          } else if (nJong === 3 && p === 12) {
            nJong = 4
          } else if (nJong === 3 && p === 18) {
            nJong = 5
          } else if (nJong === 7 && p === 0) {
            nJong = 8
          } else if (nJong === 7 && p === 6) {
            nJong = 9
          } else if (nJong === 7 && p === 7) {
            nJong = 10
          } else if (nJong === 7 && p === 9) {
            nJong = 11
          } else if (nJong === 7 && p === 16) {
            nJong = 12
          } else if (nJong === 7 && p === 17) {
            nJong = 13
          } else if (nJong === 7 && p === 18) {
            nJong = 14
          } else if (nJong === 16 && p === 9) {
            nJong = 17
          } else {
            res += makeHangul(nCho, nJung, nJong)
            nCho = CHO_DATA.indexOf(KOR_KEY.charAt(p))
            nJung = -1
            nJong = -1
          }
        }
      } else {
        if (nCho === -1) {
          if (nJong !== -1) {
            res += JONG_DATA.charAt(nJong)
            nJong = -1
          }
          nCho = CHO_DATA.indexOf(KOR_KEY.charAt(p))
        } else if (nCho === 0 && p === 9) {
          nCho = -1
          nJong = 2
        } else if (nCho === 2 && p === 12) {
          nCho = -1
          nJong = 4
        } else if (nCho === 2 && p === 18) {
          nCho = -1
          nJong = 5
        } else if (nCho === 5 && p === 0) {
          nCho = -1
          nJong = 8
        } else if (nCho === 5 && p === 6) {
          nCho = -1
          nJong = 9
        } else if (nCho === 5 && p === 7) {
          nCho = -1
          nJong = 10
        } else if (nCho === 5 && p === 9) {
          nCho = -1
          nJong = 11
        } else if (nCho === 5 && p === 16) {
          nCho = -1
          nJong = 12
        } else if (nCho === 5 && p === 17) {
          nCho = -1
          nJong = 13
        } else if (nCho === 5 && p === 18) {
          nCho = -1
          nJong = 14
        } else if (nCho === 7 && p === 9) {
          nCho = -1
          nJong = 17
        } else {
          res += CHO_DATA.charAt(nCho)
          nCho = CHO_DATA.indexOf(KOR_KEY.charAt(p))
        }
      }
    } else {
      if (nJong !== -1) {
        let newCho
        if (nJong === 2) {
          nJong = 0
          newCho = 9
        } else if (nJong === 4) {
          nJong = 3
          newCho = 12
        } else if (nJong === 5) {
          nJong = 3
          newCho = 18
        } else if (nJong === 8) {
          nJong = 7
          newCho = 0
        } else if (nJong === 9) {
          nJong = 7
          newCho = 6
        } else if (nJong === 10) {
          nJong = 7
          newCho = 7
        } else if (nJong === 11) {
          nJong = 7
          newCho = 9
        } else if (nJong === 12) {
          nJong = 7
          newCho = 16
        } else if (nJong === 13) {
          nJong = 7
          newCho = 17
        } else if (nJong === 14) {
          nJong = 7
          newCho = 18
        } else if (nJong === 17) {
          nJong = 16
          newCho = 9
        } else {
          newCho = CHO_DATA.indexOf(JONG_DATA.charAt(nJong))
          nJong = -1
        }
        if (nCho !== -1) {
          res += makeHangul(nCho, nJung, nJong)
        } else {
          res += JONG_DATA.charAt(nJong)
        }
        nCho = newCho
        nJung = -1
        nJong = -1
      }

      if (nJung === -1) {
        nJung = JUNG_DATA.indexOf(KOR_KEY.charAt(p))
      } else if (nJung === 8 && p === 19) {
        nJung = 9
      } else if (nJung === 8 && p === 20) {
        nJung = 10
      } else if (nJung === 8 && p === 32) {
        nJung = 11
      } else if (nJung === 13 && p === 23) {
        nJung = 14
      } else if (nJung === 13 && p === 24) {
        nJung = 15
      } else if (nJung === 13 && p === 32) {
        nJung = 16
      } else if (nJung === 18 && p === 23) {
        nJung = 19
      } else if (nJung === 18 && p === 24) {
        nJung = 20
      } else if (nJung === 18 && p === 32) {
        nJung = 21
      } else if (nJung === 23 && p === 32) {
        nJung = 24
      } else if (nJung === 27 && p === 32) {
        nJung = 28
      } else if (nJung === 30 && p === 32) {
        nJung = 31
      } else {
        if (nCho !== -1) {
          res += makeHangul(nCho, nJung, nJong)
        } else {
          res += JUNG_DATA.charAt(nJung)
        }
        nCho = -1
        nJung = JUNG_DATA.indexOf(KOR_KEY.charAt(p))
        nJong = -1
      }
    }
  }

  if (nCho !== -1) {
    if (nJung !== -1) {
      res += makeHangul(nCho, nJung, nJong)
    } else {
      res += CHO_DATA.charAt(nCho)
    }
  } else {
    if (nJung !== -1) {
      res += JUNG_DATA.charAt(nJung)
    } else if (nJong !== -1) {
      res += JONG_DATA.charAt(nJong)
    }
  }
  return res
}

function makeHangul(nCho: number, nJung: number, nJong: number): string {
  return String.fromCharCode(0xac00 + (nCho * 21 + nJung) * 28 + nJong + 1)
}
