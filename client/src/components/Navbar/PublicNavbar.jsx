import {
  Box,
  Flex,
  Text,
  IconButton,
  Button,
  Stack,
  useDisclosure,
  useColorModeValue,
  CloseButton,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerBody
} from '@chakra-ui/system';
import { HamburgerIcon } from '@chakra-ui/icons';

const NavBar = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();

  const Links = [
    { name: 'Home', path: '/' },
    { name: 'About', path: '/about' },
    { name: 'Services', path: '/services' },
    { name: 'Contact', path: '/contact' },
  ];

  const NavLink = ({name, path}) => (
    <Box
      as="a"
      px={2}
      py={1}
      rounded={'md'}
      _hover={{
        textDecoration: 'none',
        bg: useColorModeValue('gray.200', 'gray.700'),
      }}
      href={path}
    >
      {name}
    </Box>
  );

  return (
    <>
      <Box bg={useColorModeValue('gray.100', 'gray.900')} px={4}>
        <Flex h={16} alignItems={'center'} justifyContent={'space-between'}>
          <IconButton
            size={'md'}
            icon={isOpen ? <CloseButton /> : <HamburgerIcon />}
            aria-label={'Open Menu'}
            display={{ md: 'none' }}
            onClick={isOpen ? onClose : onOpen}
          />
          
          <Text fontSize="xl" fontWeight="bold">
            Your Logo
          </Text>

          <Flex alignItems={'center'} display={{ base: 'none', md: 'flex' }}>
            <Stack direction={'row'} spacing={7}>
              {Links.map((link) => (
                <NavLink key={link.name} name={link.name} path={link.path} />
              ))}
            </Stack>
          </Flex>

          <Button
            display={{ base: 'none', md: 'inline-flex' }}
            fontSize={'sm'}
            fontWeight={600}
            color={'white'}
            bg={'teal.400'}
            _hover={{
              bg: 'teal.300',
            }}
          >
            Get Started
          </Button>
        </Flex>

        {/* Mobile Drawer */}
        <Drawer isOpen={isOpen} placement="left" onClose={onClose}>
          <DrawerOverlay />
          <DrawerContent>
            <Box p={4} display="flex" justifyContent="flex-end">
              <CloseButton onClick={onClose} />
            </Box>
            <DrawerBody>
              <Stack spacing={4}>
                {Links.map((link) => (
                  <NavLink key={link.name} name={link.name} path={link.path} />
                ))}
                <Button
                  w="full"
                  colorScheme="teal"
                  variant="solid"
                >
                  Get Started
                </Button>
              </Stack>
            </DrawerBody>
          </DrawerContent>
        </Drawer>
      </Box>
    </>
  );
};

export default NavBar;